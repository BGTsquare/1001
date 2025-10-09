/*
Simple test script for admin wallets
Supports two modes:
1) SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL -> calls Supabase REST API to GET and PATCH `wallet_config`
2) ADMIN_SESSION_COOKIE + APP_URL -> calls your app endpoint `/api/admin/payments/wallets` (requires app server running and an admin session cookie)

Run with Node (PowerShell example below in docs).
*/

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE

function log(...args){ console.log(new Date().toISOString(), ...args) }

async function restMode(){
  if(!SUPABASE_URL || !SERVICE_ROLE){
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for REST mode')
  }
  const base = SUPABASE_URL.replace(/\/$/, '')
  log('REST mode: fetching wallets from', base + '/rest/v1/wallet_config')

  const res = await fetch(base + '/rest/v1/wallet_config?select=*', {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`
    }
  })
  if(!res.ok) throw new Error('GET failed: ' + res.status + ' ' + await res.text())
  const wallets = await res.json()
  console.log('wallets:', wallets)

  if(wallets.length === 0){
    log('No wallets found; exiting')
    return
  }

  const first = wallets[0]
  log('Updating first wallet id=', first.id)
  const updatedAccount = Object.assign({}, first.account_details || {}, { test_note: 'automated-test' })

  const patchRes = await fetch(base + `/rest/v1/wallet_config?id=eq.${first.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ account_details: updatedAccount })
  })

  if(!patchRes.ok) throw new Error('PATCH failed: ' + patchRes.status + ' ' + await patchRes.text())
  const patched = await patchRes.json()
  console.log('patched:', patched)
}

async function appMode(){
  if(!ADMIN_COOKIE){
    throw new Error('ADMIN_SESSION_COOKIE required for app mode')
  }
  const base = APP_URL.replace(/\/$/, '')
  log('App mode: fetching', base + '/api/admin/payments/wallets')

  const res = await fetch(base + '/api/admin/payments/wallets', {
    headers: { Cookie: ADMIN_COOKIE }
  })
  if(!res.ok) throw new Error('GET failed: ' + res.status + ' ' + await res.text())
  const json = await res.json()
  if(!json.success) throw new Error('GET error: ' + JSON.stringify(json))
  const wallets = json.data || []
  console.log('wallets:', wallets)
  if(wallets.length === 0){ log('No wallets found; exiting'); return }

  const first = wallets[0]
  log('Updating first wallet id=', first.id)
  const updatedAccount = Object.assign({}, first.account_details || {}, { test_note: 'automated-test' })

  const putRes = await fetch(base + '/api/admin/payments/wallets', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: ADMIN_COOKIE
    },
    body: JSON.stringify({ id: first.id, account_details: updatedAccount })
  })

  if(!putRes.ok) throw new Error('PUT failed: ' + putRes.status + ' ' + await putRes.text())
  const updated = await putRes.json()
  console.log('updated:', updated)
}

async function main(){
  try{
    if(SERVICE_ROLE && SUPABASE_URL){
      await restMode()
    } else if(ADMIN_COOKIE){
      await appMode()
    } else {
      console.error('Provide either SUPABASE_SERVICE_ROLE_KEY & SUPABASE_URL (REST mode) OR ADMIN_SESSION_COOKIE (app mode).')
      process.exit(2)
    }
  }catch(err){
    console.error('Error:', err.message || err)
    process.exit(1)
  }
}

main()
