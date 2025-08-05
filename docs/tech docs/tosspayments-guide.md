# TossPayments 통합 가이드

## 개요

TossPayments는 CashUp 프로젝트의 결제 시스템을 담당하는 핵심 서비스입니다. 크리에이터 수수료 정산, 캠페인 비용 결제, 구독 서비스 등 모든 금융 거래를 안전하고 효율적으로 처리합니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npm install @tosspayments/payment-sdk
npm install @tosspayments/payment-widget-sdk
```

### 환경 변수 설정

```bash
# .env.local
# 테스트 환경
TOSSPAYMENTS_CLIENT_KEY=test_ck_xxxxxxxxxxxx
TOSSPAYMENTS_SECRET_KEY=test_sk_xxxxxxxxxxxx

# 운영 환경
# TOSSPAYMENTS_CLIENT_KEY=live_ck_xxxxxxxxxxxx
# TOSSPAYMENTS_SECRET_KEY=live_sk_xxxxxxxxxxxx

TOSSPAYMENTS_SUCCESS_URL=https://cashup.kr/payments/success
TOSSPAYMENTS_FAIL_URL=https://cashup.kr/payments/fail
TOSSPAYMENTS_WEBHOOK_SECRET=your_webhook_secret
```

### TossPayments 클라이언트 설정

```typescript
// lib/payments/toss-client.ts
import { loadTossPayments } from '@tosspayments/payment-sdk';

if (!process.env.TOSSPAYMENTS_CLIENT_KEY) {
  throw new Error('TOSSPAYMENTS_CLIENT_KEY 환경 변수가 설정되지 않았습니다');
}

export const clientKey = process.env.TOSSPAYMENTS_CLIENT_KEY;
export const successUrl =
  process.env.TOSSPAYMENTS_SUCCESS_URL || 'http://localhost:3000/payments/success';
export const failUrl = process.env.TOSSPAYMENTS_FAIL_URL || 'http://localhost:3000/payments/fail';

// TossPayments 인스턴스 생성
export async function createTossPayments() {
  return await loadTossPayments(clientKey);
}

// 서버 사이드 API 클라이언트
export const tossPaymentsAPI = {
  baseURL: 'https://api.tosspayments.com/v1',
  headers: {
    Authorization: `Basic ${Buffer.from(process.env.TOSSPAYMENTS_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
};
```

## 핵심 기능 및 사용법

### 1. 결제 위젯 구현

```tsx
// components/payments/payment-widget.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { clientKey } from '@/lib/payments/toss-client';

interface PaymentWidgetProps {
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentFail?: (error: any) => void;
}

export function PaymentWidget({
  customerKey,
  amount,
  orderId,
  orderName,
  onPaymentSuccess,
  onPaymentFail,
}: PaymentWidgetProps) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<HTMLDivElement | null>(null);
  const agreementWidgetRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializePaymentWidget() {
      try {
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = paymentWidget;

        // 결제 수단 위젯 렌더링
        if (paymentMethodsWidgetRef.current) {
          await paymentWidget.renderPaymentMethods(
            paymentMethodsWidgetRef.current,
            { value: amount },
            { variantKey: 'DEFAULT' },
          );
        }

        // 약관 동의 위젯 렌더링
        if (agreementWidgetRef.current) {
          await paymentWidget.renderAgreement(agreementWidgetRef.current);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('결제 위젯 초기화 오류:', error);
        setError('결제 위젯을 불러오는데 실패했습니다');
        setIsLoading(false);
      }
    }

    initializePaymentWidget();
  }, [customerKey, amount]);

  const handlePayment = async () => {
    if (!paymentWidgetRef.current) {
      setError('결제 위젯이 초기화되지 않았습니다');
      return;
    }

    try {
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        customerEmail: 'customer@example.com', // 실제 고객 이메일로 교체
        customerName: '고객명', // 실제 고객명으로 교체
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      setError('결제 요청에 실패했습니다');
      onPaymentFail?.(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2">결제 위젯을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-500 hover:text-red-700 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 결제 수단 선택 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">결제 수단</h3>
        <div ref={paymentMethodsWidgetRef} className="border rounded-lg" />
      </div>

      {/* 약관 동의 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">약관 동의</h3>
        <div ref={agreementWidgetRef} />
      </div>

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}
```

### 2. 간편 결제 구현

```tsx
// components/payments/simple-payment.tsx
'use client';

import { useState } from 'react';
import { createTossPayments } from '@/lib/payments/toss-client';

interface SimplePaymentProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerKey: string;
}

export function SimplePayment({ amount, orderId, orderName, customerKey }: SimplePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const tossPayments = await createTossPayments();

      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName,
        customerKey,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (error) {
      console.error('카드 결제 오류:', error);
      setError('카드 결제에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const tossPayments = await createTossPayments();

      await tossPayments.requestPayment('계좌이체', {
        amount,
        orderId,
        orderName,
        customerKey,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (error) {
      console.error('계좌이체 결제 오류:', error);
      setError('계좌이체 결제에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVirtualAccountPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const tossPayments = await createTossPayments();

      await tossPayments.requestPayment('가상계좌', {
        amount,
        orderId,
        orderName,
        customerKey,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
        validHours: 24, // 가상계좌 유효시간 (24시간)
      });
    } catch (error) {
      console.error('가상계좌 결제 오류:', error);
      setError('가상계좌 결제에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">간편 결제</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleCardPayment}
          disabled={isProcessing}
          className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">💳</div>
            <div className="font-semibold">카드 결제</div>
            <div className="text-sm text-gray-500">신용/체크카드</div>
          </div>
        </button>

        <button
          onClick={handleTransferPayment}
          disabled={isProcessing}
          className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏦</div>
            <div className="font-semibold">계좌이체</div>
            <div className="text-sm text-gray-500">실시간 이체</div>
          </div>
        </button>

        <button
          onClick={handleVirtualAccountPayment}
          disabled={isProcessing}
          className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🏧</div>
            <div className="font-semibold">가상계좌</div>
            <div className="text-sm text-gray-500">무통장 입금</div>
          </div>
        </button>
      </div>

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">결제를 처리하는 중...</p>
        </div>
      )}
    </div>
  );
}
```

### 3. 결제 승인 및 검증

```typescript
// lib/payments/payment-verification.ts
import { tossPaymentsAPI } from './toss-client';

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface PaymentResult {
  success: boolean;
  payment?: any;
  error?: string;
}

export async function confirmPayment({
  paymentKey,
  orderId,
  amount,
}: PaymentConfirmRequest): Promise<PaymentResult> {
  try {
    const response = await fetch(`${tossPaymentsAPI.baseURL}/payments/confirm`, {
      method: 'POST',
      headers: tossPaymentsAPI.headers,
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '결제 승인에 실패했습니다');
    }

    const payment = await response.json();

    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
    };
  }
}

export async function getPayment(paymentKey: string) {
  try {
    const response = await fetch(`${tossPaymentsAPI.baseURL}/payments/${paymentKey}`, {
      method: 'GET',
      headers: tossPaymentsAPI.headers,
    });

    if (!response.ok) {
      throw new Error('결제 정보 조회에 실패했습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('결제 조회 오류:', error);
    throw error;
  }
}

export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number,
) {
  try {
    const response = await fetch(`${tossPaymentsAPI.baseURL}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: tossPaymentsAPI.headers,
      body: JSON.stringify({
        cancelReason,
        ...(cancelAmount && { cancelAmount }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '결제 취소에 실패했습니다');
    }

    return await response.json();
  } catch (error) {
    console.error('결제 취소 오류:', error);
    throw error;
  }
}
```

### 4. 웹훅 처리

```typescript
// app/api/webhooks/tosspayments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updatePaymentStatus } from '@/lib/database/payments';
import { sendPaymentNotification } from '@/lib/notifications/email';

const webhookSecret = process.env.TOSSPAYMENTS_WEBHOOK_SECRET!;

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('toss-signature');

    if (!signature) {
      return NextResponse.json({ error: '서명이 없습니다' }, { status: 400 });
    }

    // 웹훅 서명 검증
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: '유효하지 않은 서명입니다' }, { status: 401 });
    }

    const data = JSON.parse(payload);
    const { eventType, data: eventData } = data;

    switch (eventType) {
      case 'Payment.StatusChanged':
        await handlePaymentStatusChanged(eventData);
        break;

      case 'Payment.Canceled':
        await handlePaymentCanceled(eventData);
        break;

      case 'VirtualAccount.Deposited':
        await handleVirtualAccountDeposited(eventData);
        break;

      default:
        console.log('처리되지 않은 이벤트 타입:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json({ error: '웹훅 처리에 실패했습니다' }, { status: 500 });
  }
}

async function handlePaymentStatusChanged(data: any) {
  const { paymentKey, orderId, status } = data;

  try {
    // 데이터베이스 업데이트
    await updatePaymentStatus(orderId, status, {
      paymentKey,
      updatedAt: new Date(),
    });

    // 결제 완료 시 알림 발송
    if (status === 'DONE') {
      await sendPaymentNotification(orderId, 'success');
    }

    console.log(`결제 상태 변경: ${orderId} -> ${status}`);
  } catch (error) {
    console.error('결제 상태 변경 처리 오류:', error);
  }
}

async function handlePaymentCanceled(data: any) {
  const { paymentKey, orderId, cancelReason } = data;

  try {
    await updatePaymentStatus(orderId, 'CANCELED', {
      paymentKey,
      cancelReason,
      canceledAt: new Date(),
    });

    await sendPaymentNotification(orderId, 'canceled');

    console.log(`결제 취소: ${orderId} - ${cancelReason}`);
  } catch (error) {
    console.error('결제 취소 처리 오류:', error);
  }
}

async function handleVirtualAccountDeposited(data: any) {
  const { paymentKey, orderId, amount } = data;

  try {
    await updatePaymentStatus(orderId, 'DONE', {
      paymentKey,
      paidAmount: amount,
      paidAt: new Date(),
    });

    await sendPaymentNotification(orderId, 'success');

    console.log(`가상계좌 입금 완료: ${orderId} - ${amount}원`);
  } catch (error) {
    console.error('가상계좌 입금 처리 오류:', error);
  }
}
```

## CashUp 특화 결제 기능

### 1. 크리에이터 수수료 정산

```typescript
// lib/payments/creator-settlement.ts
import { getCreatorCampaigns } from '@/lib/database/campaigns';
import { createSettlement } from '@/lib/database/settlements';
import { transferToCreator } from './transfers';

interface SettlementRequest {
  creatorId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export async function processCreatorSettlement({ creatorId, period }: SettlementRequest) {
  try {
    // 1. 해당 기간의 완료된 캠페인 조회
    const campaigns = await getCreatorCampaigns(creatorId, {
      status: 'COMPLETED',
      startDate: period.startDate,
      endDate: period.endDate,
    });

    // 2. 수수료 계산
    let totalEarnings = 0;
    const campaignDetails = [];

    for (const campaign of campaigns) {
      const earnings = calculateCreatorEarnings(campaign);
      totalEarnings += earnings;

      campaignDetails.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        baseAmount: campaign.amount,
        commissionRate: campaign.commissionRate || 0.15, // 기본 15%
        earnings,
      });
    }

    if (totalEarnings <= 0) {
      throw new Error('정산할 금액이 없습니다');
    }

    // 3. 정산 기록 생성
    const settlement = await createSettlement({
      creatorId,
      period,
      totalAmount: totalEarnings,
      campaignDetails,
      status: 'PENDING',
    });

    // 4. 실제 송금 처리
    const transferResult = await transferToCreator({
      creatorId,
      amount: totalEarnings,
      settlementId: settlement.id,
      description: `${period.startDate.toISOString().slice(0, 7)} 크리에이터 수수료 정산`,
    });

    // 5. 정산 상태 업데이트
    await updateSettlementStatus(settlement.id, 'COMPLETED', {
      transferId: transferResult.transferId,
      completedAt: new Date(),
    });

    return {
      success: true,
      settlement,
      transferResult,
    };
  } catch (error) {
    console.error('크리에이터 정산 오류:', error);
    throw error;
  }
}

function calculateCreatorEarnings(campaign: any): number {
  const baseAmount = campaign.amount;
  const commissionRate = campaign.commissionRate || 0.15;
  const performanceBonus = calculatePerformanceBonus(campaign);

  return Math.floor(baseAmount * (1 - commissionRate) + performanceBonus);
}

function calculatePerformanceBonus(campaign: any): number {
  // 성과 기반 보너스 계산 로직
  const { views, engagement, conversions } = campaign.metrics || {};

  let bonus = 0;

  // 조회수 보너스
  if (views > campaign.targetViews * 1.5) {
    bonus += campaign.amount * 0.05; // 5% 보너스
  }

  // 참여율 보너스
  if (engagement > 0.05) {
    // 5% 이상
    bonus += campaign.amount * 0.03; // 3% 보너스
  }

  // 전환율 보너스
  if (conversions > campaign.targetConversions) {
    bonus += campaign.amount * 0.1; // 10% 보너스
  }

  return Math.floor(bonus);
}
```

### 2. 구독 결제 시스템

```typescript
// lib/payments/subscription.ts
import { createTossPayments } from './toss-client';
import { createSubscription, updateSubscription } from '@/lib/database/subscriptions';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: '베이직',
    price: 29000,
    interval: 'monthly',
    features: ['기본 매칭', '월 5개 캠페인', '기본 분석'],
  },
  {
    id: 'pro',
    name: '프로',
    price: 59000,
    interval: 'monthly',
    features: ['고급 매칭', '무제한 캠페인', '상세 분석', 'AI 추천'],
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    price: 99000,
    interval: 'monthly',
    features: ['전체 기능', '전담 매니저', '커스텀 분석', 'API 접근'],
  },
];

export async function createSubscriptionPayment(
  userId: string,
  planId: string,
  customerKey: string,
) {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  if (!plan) {
    throw new Error('유효하지 않은 구독 플랜입니다');
  }

  const orderId = `sub_${userId}_${Date.now()}`;
  const orderName = `CashUp ${plan.name} 구독`;

  try {
    const tossPayments = await createTossPayments();

    // 자동 결제를 위한 빌링키 발급
    await tossPayments.requestBillingAuth(customerKey, {
      successUrl: `${window.location.origin}/subscription/success`,
      failUrl: `${window.location.origin}/subscription/fail`,
    });

    // 첫 결제 진행
    await tossPayments.requestPayment('카드', {
      amount: plan.price,
      orderId,
      orderName,
      customerKey,
      successUrl: `${window.location.origin}/subscription/success`,
      failUrl: `${window.location.origin}/subscription/fail`,
    });
  } catch (error) {
    console.error('구독 결제 오류:', error);
    throw error;
  }
}

export async function processRecurringPayment(subscriptionId: string, billingKey: string) {
  try {
    const subscription = await getSubscription(subscriptionId);
    const plan = subscriptionPlans.find((p) => p.id === subscription.planId);

    if (!plan) {
      throw new Error('구독 플랜을 찾을 수 없습니다');
    }

    const orderId = `recurring_${subscriptionId}_${Date.now()}`;

    const response = await fetch(`${tossPaymentsAPI.baseURL}/billing/${billingKey}`, {
      method: 'POST',
      headers: tossPaymentsAPI.headers,
      body: JSON.stringify({
        customerKey: subscription.customerKey,
        amount: plan.price,
        orderId,
        orderName: `CashUp ${plan.name} 구독 (자동결제)`,
      }),
    });

    if (!response.ok) {
      throw new Error('자동 결제에 실패했습니다');
    }

    const payment = await response.json();

    // 구독 갱신
    await updateSubscription(subscriptionId, {
      lastPaymentDate: new Date(),
      nextPaymentDate: getNextPaymentDate(plan.interval),
      status: 'ACTIVE',
    });

    return payment;
  } catch (error) {
    console.error('정기 결제 오류:', error);

    // 결제 실패 시 구독 상태 업데이트
    await updateSubscription(subscriptionId, {
      status: 'PAYMENT_FAILED',
      failedAt: new Date(),
    });

    throw error;
  }
}

function getNextPaymentDate(interval: 'monthly' | 'yearly'): Date {
  const now = new Date();

  if (interval === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  }
}
```

### 3. 에스크로 시스템

```typescript
// lib/payments/escrow.ts
import { createEscrowAccount, updateEscrowStatus } from '@/lib/database/escrow';

interface EscrowRequest {
  campaignId: string;
  businessId: string;
  creatorId: string;
  amount: number;
  terms: {
    deliveryDeadline: Date;
    approvalPeriod: number; // 승인 기간 (일)
    penaltyRate: number; // 위약금 비율
  };
}

export async function createEscrowPayment(request: EscrowRequest) {
  try {
    // 1. 에스크로 계정 생성
    const escrow = await createEscrowAccount({
      campaignId: request.campaignId,
      businessId: request.businessId,
      creatorId: request.creatorId,
      amount: request.amount,
      terms: request.terms,
      status: 'PENDING',
    });

    // 2. 비즈니스로부터 결제 받기
    const orderId = `escrow_${escrow.id}_${Date.now()}`;

    const tossPayments = await createTossPayments();
    await tossPayments.requestPayment('카드', {
      amount: request.amount,
      orderId,
      orderName: `캠페인 에스크로 결제 - ${request.campaignId}`,
      customerKey: request.businessId,
      successUrl: `${window.location.origin}/escrow/success`,
      failUrl: `${window.location.origin}/escrow/fail`,
    });

    return escrow;
  } catch (error) {
    console.error('에스크로 결제 생성 오류:', error);
    throw error;
  }
}

export async function releaseEscrowPayment(
  escrowId: string,
  releaseType: 'full' | 'partial',
  amount?: number,
) {
  try {
    const escrow = await getEscrow(escrowId);

    if (escrow.status !== 'FUNDED') {
      throw new Error('에스크로가 자금 조달 상태가 아닙니다');
    }

    const releaseAmount = releaseType === 'full' ? escrow.amount : amount || 0;

    if (releaseAmount <= 0 || releaseAmount > escrow.amount) {
      throw new Error('유효하지 않은 해제 금액입니다');
    }

    // 크리에이터에게 송금
    const transferResult = await transferToCreator({
      creatorId: escrow.creatorId,
      amount: releaseAmount,
      escrowId,
      description: `캠페인 완료 - 에스크로 해제`,
    });

    // 에스크로 상태 업데이트
    await updateEscrowStatus(escrowId, 'RELEASED', {
      releasedAmount: releaseAmount,
      releasedAt: new Date(),
      transferId: transferResult.transferId,
    });

    return {
      success: true,
      releasedAmount: releaseAmount,
      transferResult,
    };
  } catch (error) {
    console.error('에스크로 해제 오류:', error);
    throw error;
  }
}

export async function refundEscrowPayment(
  escrowId: string,
  refundReason: string,
  refundAmount?: number,
) {
  try {
    const escrow = await getEscrow(escrowId);

    const refundAmountFinal = refundAmount || escrow.amount;

    // 원래 결제 취소/환불
    const cancelResult = await cancelPayment(escrow.paymentKey, refundReason, refundAmountFinal);

    // 에스크로 상태 업데이트
    await updateEscrowStatus(escrowId, 'REFUNDED', {
      refundedAmount: refundAmountFinal,
      refundedAt: new Date(),
      refundReason,
    });

    return {
      success: true,
      refundedAmount: refundAmountFinal,
      cancelResult,
    };
  } catch (error) {
    console.error('에스크로 환불 오류:', error);
    throw error;
  }
}
```

## 보안 및 규정 준수

### 1. PCI DSS 준수

```typescript
// lib/payments/security.ts
import crypto from 'crypto';

// 민감한 데이터 암호화
export function encryptSensitiveData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('CashUp', 'utf8'));

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('CashUp', 'utf8'));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 결제 데이터 마스킹
export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length < 8) return cardNumber;

  const first4 = cardNumber.slice(0, 4);
  const last4 = cardNumber.slice(-4);
  const middle = '*'.repeat(cardNumber.length - 8);

  return `${first4}${middle}${last4}`;
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 6) return accountNumber;

  const first3 = accountNumber.slice(0, 3);
  const last3 = accountNumber.slice(-3);
  const middle = '*'.repeat(accountNumber.length - 6);

  return `${first3}${middle}${last3}`;
}

// 결제 로그 기록 (민감한 정보 제외)
export function logPaymentEvent(
  eventType: string,
  orderId: string,
  amount: number,
  additionalData?: Record<string, any>,
) {
  const logData = {
    timestamp: new Date().toISOString(),
    eventType,
    orderId,
    amount,
    ...additionalData,
  };

  // 민감한 정보 제거
  delete logData.cardNumber;
  delete logData.accountNumber;
  delete logData.customerKey;

  console.log('Payment Event:', JSON.stringify(logData));

  // 실제 환경에서는 보안 로그 시스템에 기록
  // await secureLogger.log(logData)
}
```

### 2. 사기 탐지 시스템

```typescript
// lib/payments/fraud-detection.ts
interface PaymentRiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
}

export async function assessPaymentRisk(
  userId: string,
  amount: number,
  paymentMethod: string,
  metadata: Record<string, any>,
): Promise<PaymentRiskAssessment> {
  const flags: string[] = [];
  let riskScore = 0;

  // 1. 금액 기반 위험도
  if (amount > 1000000) {
    // 100만원 이상
    riskScore += 30;
    flags.push('HIGH_AMOUNT');
  } else if (amount > 500000) {
    // 50만원 이상
    riskScore += 15;
    flags.push('MEDIUM_AMOUNT');
  }

  // 2. 사용자 행동 패턴
  const userHistory = await getUserPaymentHistory(userId);

  if (userHistory.length === 0) {
    riskScore += 20;
    flags.push('NEW_USER');
  }

  // 3. 빈도 체크
  const recentPayments = userHistory.filter(
    (p) => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000),
  );

  if (recentPayments.length > 5) {
    riskScore += 25;
    flags.push('HIGH_FREQUENCY');
  }

  // 4. IP 주소 체크
  const clientIP = metadata.clientIP;
  if (clientIP && (await isHighRiskIP(clientIP))) {
    riskScore += 40;
    flags.push('HIGH_RISK_IP');
  }

  // 5. 디바이스 핑거프린팅
  const deviceFingerprint = metadata.deviceFingerprint;
  if (deviceFingerprint && (await isKnownFraudDevice(deviceFingerprint))) {
    riskScore += 50;
    flags.push('FRAUD_DEVICE');
  }

  // 위험도 레벨 결정
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  let recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';

  if (riskScore >= 70) {
    riskLevel = 'HIGH';
    recommendation = 'DECLINE';
  } else if (riskScore >= 40) {
    riskLevel = 'MEDIUM';
    recommendation = 'REVIEW';
  } else {
    riskLevel = 'LOW';
    recommendation = 'APPROVE';
  }

  return {
    riskScore,
    riskLevel,
    flags,
    recommendation,
  };
}

async function isHighRiskIP(ip: string): Promise<boolean> {
  // IP 평판 데이터베이스 조회
  // 실제 구현에서는 외부 서비스 사용
  return false;
}

async function isKnownFraudDevice(fingerprint: string): Promise<boolean> {
  // 사기 디바이스 데이터베이스 조회
  return false;
}

async function getUserPaymentHistory(userId: string) {
  // 사용자 결제 이력 조회
  return [];
}
```

## 성능 최적화 및 모니터링

### 1. 결제 성능 모니터링

```typescript
// lib/payments/monitoring.ts
import { performance } from 'perf_hooks';

interface PaymentMetrics {
  duration: number;
  success: boolean;
  errorCode?: string;
  amount: number;
  paymentMethod: string;
}

class PaymentMonitor {
  private metrics: PaymentMetrics[] = [];

  async trackPayment<T>(
    operation: () => Promise<T>,
    context: {
      amount: number;
      paymentMethod: string;
    },
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();

      const duration = performance.now() - startTime;
      this.recordMetric({
        duration,
        success: true,
        amount: context.amount,
        paymentMethod: context.paymentMethod,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        duration,
        success: false,
        errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        amount: context.amount,
        paymentMethod: context.paymentMethod,
      });

      throw error;
    }
  }

  private recordMetric(metric: PaymentMetrics) {
    this.metrics.push(metric);

    // 메트릭이 너무 많이 쌓이지 않도록 제한
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // 실시간 알림 (성능 저하 감지)
    if (metric.duration > 10000) {
      // 10초 이상
      this.alertSlowPayment(metric);
    }

    if (!metric.success) {
      this.alertPaymentFailure(metric);
    }
  }

  private alertSlowPayment(metric: PaymentMetrics) {
    console.warn('느린 결제 감지:', {
      duration: `${metric.duration.toFixed(2)}ms`,
      amount: metric.amount,
      paymentMethod: metric.paymentMethod,
    });

    // 실제 환경에서는 모니터링 시스템에 알림
    // await sendAlert('SLOW_PAYMENT', metric)
  }

  private alertPaymentFailure(metric: PaymentMetrics) {
    console.error('결제 실패:', {
      errorCode: metric.errorCode,
      amount: metric.amount,
      paymentMethod: metric.paymentMethod,
    });

    // 실제 환경에서는 모니터링 시스템에 알림
    // await sendAlert('PAYMENT_FAILURE', metric)
  }

  getMetrics() {
    return {
      totalPayments: this.metrics.length,
      successRate: this.metrics.filter((m) => m.success).length / this.metrics.length,
      averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      errorCodes: this.getErrorCodeStats(),
    };
  }

  private getErrorCodeStats() {
    const errorCodes = this.metrics
      .filter((m) => !m.success && m.errorCode)
      .map((m) => m.errorCode!);

    const stats: Record<string, number> = {};
    errorCodes.forEach((code) => {
      stats[code] = (stats[code] || 0) + 1;
    });

    return stats;
  }
}

export const paymentMonitor = new PaymentMonitor();
```

### 2. 캐싱 및 최적화

```typescript
// lib/payments/cache.ts
import { LRUCache } from 'lru-cache';

// 결제 정보 캐시
const paymentCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5분
});

// 사용자 결제 방법 캐시
const paymentMethodCache = new LRUCache<string, any>({
  max: 5000,
  ttl: 1000 * 60 * 30, // 30분
});

export async function getCachedPayment(paymentKey: string) {
  const cached = paymentCache.get(paymentKey);
  if (cached) {
    return cached;
  }

  const payment = await getPayment(paymentKey);
  paymentCache.set(paymentKey, payment);

  return payment;
}

export async function getCachedUserPaymentMethods(userId: string) {
  const cached = paymentMethodCache.get(userId);
  if (cached) {
    return cached;
  }

  const methods = await getUserPaymentMethods(userId);
  paymentMethodCache.set(userId, methods);

  return methods;
}

// 결제 상태 변경 시 캐시 무효화
export function invalidatePaymentCache(paymentKey: string) {
  paymentCache.delete(paymentKey);
}

export function invalidateUserPaymentMethodCache(userId: string) {
  paymentMethodCache.delete(userId);
}
```

## 테스트 및 디버깅

### 1. 결제 테스트 도구

```typescript
// lib/payments/test-utils.ts
export const testCards = {
  success: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
    description: '성공하는 테스트 카드',
  },
  decline: {
    number: '4000000000000002',
    expiry: '12/25',
    cvc: '123',
    description: '거절되는 테스트 카드',
  },
  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/25',
    cvc: '123',
    description: '잔액 부족 테스트 카드',
  },
};

export async function createTestPayment(
  amount: number,
  cardType: keyof typeof testCards = 'success',
) {
  const orderId = `test_${Date.now()}`;
  const card = testCards[cardType];

  console.log(`테스트 결제 생성: ${amount}원, 카드: ${card.description}`);

  // 실제 테스트 결제 로직
  return {
    orderId,
    amount,
    cardType,
    status: cardType === 'success' ? 'PAID' : 'FAILED',
  };
}

export function generateTestOrderId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

## 참고 자료

- [TossPayments 공식 문서](https://docs.tosspayments.com/)
- [결제위젯 SDK 가이드](https://docs.tosspayments.com/reference/widget-sdk)
- [TossPayments API 레퍼런스](https://docs.tosspayments.com/reference)
- [웹훅 가이드](https://docs.tosspayments.com/guides/webhook)
- [보안 가이드](https://docs.tosspayments.com/guides/security)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
