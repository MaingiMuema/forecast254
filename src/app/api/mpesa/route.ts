/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// M-Pesa API credentials
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const BUSINESS_SHORT_CODE = process.env.MPESA_SHORTCODE || '';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';

// Helper function to get OAuth token
async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await response.json();
  return data.access_token;
}

// Helper function to generate timestamp
function generateTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// Helper function to generate password
function generatePassword(timestamp: string) {
  const data = `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, amount, userId } = await request.json();
    
    // Format phone number (remove leading 0 or +254)
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254');
    
    // Generate timestamp
    const timestamp = generateTimestamp();
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // STK Push request
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: BUSINESS_SHORT_CODE,
          Password: generatePassword(timestamp),
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: BUSINESS_SHORT_CODE,
          PhoneNumber: formattedPhone,
          CallBackURL: CALLBACK_URL,
          AccountReference: 'Forecast254',
          TransactionDesc: 'Wallet Deposit',
        }),
      }
    );

    const mpesaResponse = await response.json();

    if (mpesaResponse.ResponseCode === '0') {
      // Create pending transaction in database
      const supabase = createRouteHandlerClient({ cookies });
      
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        description: 'M-Pesa Deposit',
        mpesa_checkout_id: mpesaResponse.CheckoutRequestID,
      });

      return NextResponse.json({
        success: true,
        message: 'STK push sent successfully',
        checkoutRequestId: mpesaResponse.CheckoutRequestID,
      });
    } else {
      throw new Error('Failed to initiate M-Pesa payment');
    }
  } catch (error: any) {
    console.error('M-Pesa API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const mpesaCallback = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get the transaction details
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_checkout_id', mpesaCallback.CheckoutRequestID)
      .single();

    if (fetchError) throw fetchError;

    // Update transaction status based on M-Pesa response
    if (mpesaCallback.ResultCode === '0') {
      // Success - Update transaction and user balance
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_receipt: mpesaCallback.MpesaReceiptNumber,
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // Update user balance
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        p_user_id: transaction.user_id,
        p_amount: transaction.amount,
      });

      if (balanceError) throw balanceError;

      return NextResponse.json({
        success: true,
        message: 'Payment completed successfully',
      });
    } else {
      // Failed - Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          description: `M-Pesa payment failed: ${mpesaCallback.ResultDesc}`,
        })
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        message: 'Payment failed',
      });
    }
  } catch (error: any) {
    console.error('M-Pesa Callback Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
