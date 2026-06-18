#!/usr/bin/env python3
"""
Fetches market prices via yfinance and pushes them to Railway.
Runs from GitHub Actions. yfinance handles Yahoo session/crumb internally.

Required env vars:
  RAILWAY_URL         — e.g. https://tu-app.up.railway.app
  PRICES_PUSH_SECRET  — shared secret with Railway backend
"""

import os
import sys
import time
import json
import requests
import yfinance as yf

RAILWAY_URL = os.environ.get('RAILWAY_URL', '').rstrip('/').strip()
SECRET = os.environ.get('PRICES_PUSH_SECRET', '').strip()

if not RAILWAY_URL or not SECRET:
    print('Faltan RAILWAY_URL o PRICES_PUSH_SECRET')
    sys.exit(1)

TIPOS_LOCALES = {'ACCION', 'CEDEAR', 'BONO', 'ON'}

def build_symbol(ticker, tipo_activo):
    return f"{ticker}.BA" if tipo_activo in TIPOS_LOCALES else ticker

def fetch_price(ticker, tipo_activo):
    symbol = build_symbol(ticker, tipo_activo)
    yf_ticker = yf.Ticker(symbol)
    info = yf_ticker.fast_info

    price = info.last_price
    if not price or price != price:  # NaN check
        raise ValueError(f'Sin precio para {symbol}')

    prev_close = getattr(info, 'previous_close', None) or price
    variacion = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0

    return {
        'ticker': ticker,
        'precio': round(float(price), 4),
        'moneda': 'USD' if tipo_activo == 'ADR' else 'ARS',
        'variacion_pct': variacion,
        'mercado_abierto': True,
        'fuente': 'yahoo',
    }

def main():
    # 1. Obtener tickers activos desde Railway
    print(f'Obteniendo tickers desde {RAILWAY_URL}/api/prices/tickers ...')
    r = requests.get(f'{RAILWAY_URL}/api/prices/tickers', timeout=10)
    r.raise_for_status()
    tickers = r.json()['data']

    to_fetch = [t for t in tickers if t['tipo_activo'] != 'FCI']

    if not to_fetch:
        print('No hay tickers para fetchear. Saliendo.')
        return

    print(f"Fetcheando {len(to_fetch)} tickers: {', '.join(t['ticker'] for t in to_fetch)}")

    # 2. Fetchear precios via yfinance
    prices = []
    errors = []

    for t in to_fetch:
        try:
            price = fetch_price(t['ticker'], t['tipo_activo'])
            prices.append(price)
            print(f"  [ok] {t['ticker']}: {price['precio']} {price['moneda']}")
        except Exception as e:
            errors.append({'ticker': t['ticker'], 'error': str(e)})
            print(f"  [error] {t['ticker']}: {e}")
        time.sleep(0.5)

    if not prices:
        print('Ningún precio obtenido. Abortando push.')
        sys.exit(1)

    # 3. Push a Railway
    print(f'\nPusheando {len(prices)} precios a Railway...')
    resp = requests.post(
        f'{RAILWAY_URL}/api/prices/push',
        json={'prices': prices},
        headers={
            'Authorization': f'Bearer {SECRET}',
            'Content-Type': 'application/json',
        },
        timeout=15,
    )
    resp.raise_for_status()
    result = resp.json()

    print(f"Guardado: {result['updated']} precios.")
    if result.get('tipo_cambio'):
        tc = result['tipo_cambio']
        print(f"Tipo de cambio: oficial={tc.get('oficial')} MEP={tc.get('mep')}")
    if result.get('errors'):
        print(f"Errores al guardar: {result['errors']}")

    if errors:
        print(f'Errores al fetchear ({len(errors)}): {[e["ticker"] for e in errors]}')
        # Solo fallar si NO se pudo pushear ningún precio
        if result.get('updated', 0) == 0:
            sys.exit(1)

if __name__ == '__main__':
    main()
