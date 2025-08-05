# Resend 이메일 서비스 가이드

## 개요

Resend는 CashUp 프로젝트의 이메일 전송 서비스를 담당하는 핵심 인프라입니다. 사용자 인증, 캠페인 알림, 마케팅 이메일, 시스템 알림 등 모든 이메일 커뮤니케이션을 처리합니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npm install resend
npm install @react-email/components
npm install @react-email/render
```

### 환경 변수 설정

```bash
# .env.local
RESEND_API_KEY=re_FFPn1HYB_AbpAQPrfpfKos6oN1FhxuU6B
RESEND_FROM_EMAIL=noreply@cashup.kr
RESEND_SUPPORT_EMAIL=support@cashup.kr
RESEND_MARKETING_EMAIL=marketing@cashup.kr

# 개발 환경에서는 테스트 도메인 사용
# RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Resend 클라이언트 설정

```typescript
// lib/email/resend-client.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY 환경 변수가 설정되지 않았습니다');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  support: process.env.RESEND_SUPPORT_EMAIL || 'support@cashup.kr',
  marketing: process.env.RESEND_MARKETING_EMAIL || 'marketing@cashup.kr',
  replyTo: process.env.RESEND_SUPPORT_EMAIL || 'support@cashup.kr',
};

// 이메일 전송 상태 추적
export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from = emailConfig.from,
  replyTo = emailConfig.replyTo,
  tags = [],
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  tags?: string[];
}): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
      replyTo,
      tags: [
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
        { name: 'service', value: 'cashup' },
        ...tags.map((tag) => ({ name: 'category', value: tag })),
      ],
    });

    if (error) {
      console.error('이메일 전송 오류:', error);
      return { success: false, error: error.message };
    }

    console.log('이메일 전송 성공:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('이메일 전송 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
```

## React Email 템플릿 시스템

### 1. 기본 템플릿 구조

```tsx
// emails/components/layout.tsx
import { Html, Head, Body, Container, Section, Img, Text, Link, Hr } from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export function EmailLayout({ children, previewText }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        {previewText && <Text style={preview}>{previewText}</Text>}
        <Container style={container}>
          {/* 헤더 */}
          <Section style={header}>
            <Img
              src="https://cashup.kr/logo.png"
              width="120"
              height="40"
              alt="CashUp"
              style={logo}
            />
          </Section>

          {/* 메인 콘텐츠 */}
          <Section style={content}>{children}</Section>

          {/* 푸터 */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>이 이메일은 CashUp에서 발송되었습니다.</Text>
            <Text style={footerText}>
              <Link href="https://cashup.kr/unsubscribe" style={link}>
                수신거부
              </Link>
              {' | '}
              <Link href="https://cashup.kr/privacy" style={link}>
                개인정보처리방침
              </Link>
              {' | '}
              <Link href="https://cashup.kr/terms" style={link}>
                이용약관
              </Link>
            </Text>
            <Text style={footerText}>© 2024 CashUp. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// 스타일 정의
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const preview = {
  display: 'none',
  overflow: 'hidden',
  lineHeight: '1px',
  opacity: 0,
  maxHeight: 0,
  maxWidth: 0,
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 24px',
};

const footer = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};
```

### 2. 사용자 인증 이메일 템플릿

```tsx
// emails/auth/welcome-email.tsx
import { Button, Heading, Text } from '@react-email/components';
import { EmailLayout } from '../components/layout';

interface WelcomeEmailProps {
  userName: string;
  userType: 'creator' | 'business';
  verificationUrl: string;
}

export function WelcomeEmail({ userName, userType, verificationUrl }: WelcomeEmailProps) {
  const userTypeText = userType === 'creator' ? '크리에이터' : '비즈니스';

  return (
    <EmailLayout previewText={`CashUp에 오신 것을 환영합니다, ${userName}님!`}>
      <Heading style={h1}>CashUp에 오신 것을 환영합니다! 🎉</Heading>

      <Text style={text}>안녕하세요 {userName}님,</Text>

      <Text style={text}>
        CashUp {userTypeText} 회원으로 가입해 주셔서 감사합니다. 아래 버튼을 클릭하여 이메일 인증을
        완료해 주세요.
      </Text>

      <Button href={verificationUrl} style={button}>
        이메일 인증하기
      </Button>

      <Text style={text}>
        버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:
      </Text>

      <Text style={linkText}>{verificationUrl}</Text>

      <Text style={text}>이 링크는 24시간 후에 만료됩니다.</Text>

      {userType === 'creator' && (
        <>
          <Text style={text}>
            <strong>크리에이터로서 CashUp에서 할 수 있는 것들:</strong>
          </Text>
          <Text style={text}>
            • AI 기반 브랜드 매칭으로 최적의 협업 기회 발견 • 블록 기반 페이지 빌더로 나만의
            포트폴리오 제작 • 3단계 추천 시스템으로 추가 수익 창출 • 실시간 캠페인 성과 분석 및
            최적화
          </Text>
        </>
      )}

      {userType === 'business' && (
        <>
          <Text style={text}>
            <strong>비즈니스로서 CashUp에서 할 수 있는 것들:</strong>
          </Text>
          <Text style={text}>
            • AI 추천으로 브랜드에 최적화된 크리에이터 발견 • 통합 대시보드에서 모든 캠페인 관리 •
            실시간 성과 추적 및 ROI 분석 • 안전한 에스크로 결제 시스템
          </Text>
        </>
      )}

      <Text style={text}>궁금한 점이 있으시면 언제든지 문의해 주세요.</Text>

      <Text style={text}>
        감사합니다,
        <br />
        CashUp 팀
      </Text>
    </EmailLayout>
  );
}

// 스타일 정의
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 24px',
  margin: '32px auto',
};

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};
```

### 3. 비밀번호 재설정 이메일

```tsx
// emails/auth/password-reset-email.tsx
import { Button, Heading, Text } from '@react-email/components';
import { EmailLayout } from '../components/layout';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  ipAddress?: string;
  userAgent?: string;
}

export function PasswordResetEmail({
  userName,
  resetUrl,
  ipAddress,
  userAgent,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText="CashUp 비밀번호 재설정 요청">
      <Heading style={h1}>비밀번호 재설정 요청</Heading>

      <Text style={text}>안녕하세요 {userName}님,</Text>

      <Text style={text}>
        CashUp 계정의 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를
        설정해 주세요.
      </Text>

      <Button href={resetUrl} style={button}>
        비밀번호 재설정하기
      </Button>

      <Text style={text}>
        버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 붙여넣어 주세요:
      </Text>

      <Text style={linkText}>{resetUrl}</Text>

      <Text style={text}>이 링크는 1시간 후에 만료됩니다.</Text>

      {(ipAddress || userAgent) && (
        <>
          <Text style={securityText}>
            <strong>보안 정보:</strong>
          </Text>
          {ipAddress && <Text style={securityText}>IP 주소: {ipAddress}</Text>}
          {userAgent && <Text style={securityText}>브라우저: {userAgent}</Text>}
        </>
      )}

      <Text style={warningText}>
        ⚠️ 만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하고 즉시 고객지원팀에 문의해
        주세요.
      </Text>

      <Text style={text}>
        감사합니다,
        <br />
        CashUp 보안팀
      </Text>
    </EmailLayout>
  );
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 24px',
  margin: '32px auto',
};

const linkText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const securityText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const warningText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  border: '1px solid #fecaca',
};
```

## CashUp 특화 이메일 템플릿

### 1. 캠페인 알림 이메일

```tsx
// emails/campaigns/campaign-notification.tsx
import { Button, Heading, Text, Section, Row, Column } from '@react-email/components';
import { EmailLayout } from '../components/layout';

interface CampaignNotificationProps {
  recipientName: string;
  campaignTitle: string;
  campaignDescription: string;
  brandName: string;
  budget: number;
  deadline: string;
  requirements: string[];
  actionUrl: string;
  notificationType:
    | 'new_match'
    | 'application_received'
    | 'campaign_approved'
    | 'campaign_completed';
}

export function CampaignNotificationEmail({
  recipientName,
  campaignTitle,
  campaignDescription,
  brandName,
  budget,
  deadline,
  requirements,
  actionUrl,
  notificationType,
}: CampaignNotificationProps) {
  const getNotificationContent = () => {
    switch (notificationType) {
      case 'new_match':
        return {
          title: '새로운 캠페인 매칭! 🎯',
          message: 'AI가 회원님에게 완벽한 캠페인을 찾았습니다.',
          buttonText: '캠페인 확인하기',
          emoji: '🎯',
        };
      case 'application_received':
        return {
          title: '캠페인 지원서가 접수되었습니다 📝',
          message: '크리에이터가 회원님의 캠페인에 지원했습니다.',
          buttonText: '지원서 확인하기',
          emoji: '📝',
        };
      case 'campaign_approved':
        return {
          title: '캠페인이 승인되었습니다! 🎉',
          message: '축하합니다! 캠페인 협업이 시작됩니다.',
          buttonText: '캠페인 시작하기',
          emoji: '🎉',
        };
      case 'campaign_completed':
        return {
          title: '캠페인이 완료되었습니다 ✅',
          message: '성공적인 캠페인 완료를 축하드립니다!',
          buttonText: '결과 확인하기',
          emoji: '✅',
        };
    }
  };

  const content = getNotificationContent();

  return (
    <EmailLayout previewText={`${content.title} - ${campaignTitle}`}>
      <Heading style={h1}>{content.title}</Heading>

      <Text style={text}>안녕하세요 {recipientName}님,</Text>

      <Text style={text}>{content.message}</Text>

      {/* 캠페인 정보 카드 */}
      <Section style={campaignCard}>
        <Heading style={campaignTitle}>{campaignTitle}</Heading>

        <Text style={brandText}>
          브랜드: <strong>{brandName}</strong>
        </Text>

        <Text style={campaignDescription}>{campaignDescription}</Text>

        <Row>
          <Column style={infoColumn}>
            <Text style={infoLabel}>예산</Text>
            <Text style={infoValue}>{budget.toLocaleString()}원</Text>
          </Column>
          <Column style={infoColumn}>
            <Text style={infoLabel}>마감일</Text>
            <Text style={infoValue}>{deadline}</Text>
          </Column>
        </Row>

        {requirements.length > 0 && (
          <>
            <Text style={requirementsTitle}>요구사항:</Text>
            {requirements.map((req, index) => (
              <Text key={index} style={requirementItem}>
                • {req}
              </Text>
            ))}
          </>
        )}
      </Section>

      <Button href={actionUrl} style={button}>
        {content.buttonText}
      </Button>

      <Text style={text}>CashUp에서 더 많은 기회를 확인해 보세요!</Text>

      <Text style={text}>
        감사합니다,
        <br />
        CashUp 팀
      </Text>
    </EmailLayout>
  );
}

// 스타일 정의
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const campaignCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const campaignTitle = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const brandText = {
  color: '#3b82f6',
  fontSize: '16px',
  margin: '8px 0',
};

const campaignDescription = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
};

const infoColumn = {
  width: '50%',
  paddingRight: '12px',
};

const infoLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '16px 0 4px 0',
};

const infoValue = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const requirementsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '20px 0 8px 0',
};

const requirementItem = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 24px',
  margin: '32px auto',
};
```

### 2. 결제 관련 이메일

```tsx
// emails/payments/payment-notification.tsx
import { Button, Heading, Text, Section, Row, Column } from '@react-email/components';
import { EmailLayout } from '../components/layout';

interface PaymentNotificationProps {
  recipientName: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionDate: string;
  description: string;
  notificationType: 'success' | 'failed' | 'refund' | 'settlement';
  actionUrl?: string;
}

export function PaymentNotificationEmail({
  recipientName,
  orderId,
  amount,
  paymentMethod,
  transactionDate,
  description,
  notificationType,
  actionUrl,
}: PaymentNotificationProps) {
  const getNotificationContent = () => {
    switch (notificationType) {
      case 'success':
        return {
          title: '결제가 완료되었습니다 ✅',
          message: '결제가 성공적으로 처리되었습니다.',
          color: '#10b981',
          buttonText: '결제 내역 확인',
        };
      case 'failed':
        return {
          title: '결제에 실패했습니다 ❌',
          message: '결제 처리 중 문제가 발생했습니다.',
          color: '#ef4444',
          buttonText: '다시 시도하기',
        };
      case 'refund':
        return {
          title: '환불이 완료되었습니다 💰',
          message: '요청하신 환불이 처리되었습니다.',
          color: '#f59e0b',
          buttonText: '환불 내역 확인',
        };
      case 'settlement':
        return {
          title: '정산이 완료되었습니다 💸',
          message: '크리에이터 수수료 정산이 완료되었습니다.',
          color: '#8b5cf6',
          buttonText: '정산 내역 확인',
        };
    }
  };

  const content = getNotificationContent();

  return (
    <EmailLayout previewText={`${content.title} - ${amount.toLocaleString()}원`}>
      <Heading style={h1}>{content.title}</Heading>

      <Text style={text}>안녕하세요 {recipientName}님,</Text>

      <Text style={text}>{content.message}</Text>

      {/* 결제 정보 카드 */}
      <Section style={paymentCard}>
        <Row>
          <Column style={labelColumn}>
            <Text style={label}>주문번호</Text>
          </Column>
          <Column style={valueColumn}>
            <Text style={value}>{orderId}</Text>
          </Column>
        </Row>

        <Row>
          <Column style={labelColumn}>
            <Text style={label}>금액</Text>
          </Column>
          <Column style={valueColumn}>
            <Text style={{ ...value, color: content.color, fontWeight: 'bold' }}>
              {amount.toLocaleString()}원
            </Text>
          </Column>
        </Row>

        <Row>
          <Column style={labelColumn}>
            <Text style={label}>결제수단</Text>
          </Column>
          <Column style={valueColumn}>
            <Text style={value}>{paymentMethod}</Text>
          </Column>
        </Row>

        <Row>
          <Column style={labelColumn}>
            <Text style={label}>처리일시</Text>
          </Column>
          <Column style={valueColumn}>
            <Text style={value}>{transactionDate}</Text>
          </Column>
        </Row>

        <Row>
          <Column style={labelColumn}>
            <Text style={label}>내용</Text>
          </Column>
          <Column style={valueColumn}>
            <Text style={value}>{description}</Text>
          </Column>
        </Row>
      </Section>

      {actionUrl && (
        <Button href={actionUrl} style={{ ...button, backgroundColor: content.color }}>
          {content.buttonText}
        </Button>
      )}

      {notificationType === 'failed' && (
        <Text style={helpText}>결제에 문제가 있으시면 고객지원팀에 문의해 주세요.</Text>
      )}

      <Text style={text}>
        감사합니다,
        <br />
        CashUp 결제팀
      </Text>
    </EmailLayout>
  );
}

// 스타일 정의
const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const paymentCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const labelColumn = {
  width: '30%',
  paddingRight: '16px',
  verticalAlign: 'top' as const,
};

const valueColumn = {
  width: '70%',
};

const label = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const value = {
  color: '#1e293b',
  fontSize: '14px',
  margin: '8px 0',
};

const button = {
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 24px',
  margin: '32px auto',
};

const helpText = {
  color: '#dc2626',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};
```

## 이메일 서비스 구현

### 1. 인증 이메일 서비스

```typescript
// lib/email/auth-service.ts
import { sendEmail } from './resend-client';
import { WelcomeEmail } from '../../emails/auth/welcome-email';
import { PasswordResetEmail } from '../../emails/auth/password-reset-email';
import { render } from '@react-email/render';

interface SendWelcomeEmailParams {
  to: string;
  userName: string;
  userType: 'creator' | 'business';
  verificationToken: string;
}

export async function sendWelcomeEmail({
  to,
  userName,
  userType,
  verificationToken,
}: SendWelcomeEmailParams) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;

  return await sendEmail({
    to,
    subject: 'CashUp에 오신 것을 환영합니다! 이메일 인증을 완료해 주세요',
    react: WelcomeEmail({
      userName,
      userType,
      verificationUrl,
    }),
    tags: ['auth', 'welcome', userType],
  });
}

interface SendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetToken,
  ipAddress,
  userAgent,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

  return await sendEmail({
    to,
    subject: 'CashUp 비밀번호 재설정 요청',
    react: PasswordResetEmail({
      userName,
      resetUrl,
      ipAddress,
      userAgent,
    }),
    tags: ['auth', 'password-reset'],
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  userName: string,
  verificationToken: string,
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;

  return await sendEmail({
    to,
    subject: 'CashUp 이메일 인증',
    react: WelcomeEmail({
      userName,
      userType: 'creator', // 기본값, 실제로는 사용자 타입에 따라 설정
      verificationUrl,
    }),
    tags: ['auth', 'email-verification'],
  });
}

export async function sendLoginNotificationEmail(
  to: string,
  userName: string,
  loginInfo: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    timestamp: Date;
  },
) {
  // 로그인 알림 이메일 구현
  // 보안상 중요한 로그인 시에만 발송
}
```

### 2. 캠페인 알림 서비스

```typescript
// lib/email/campaign-service.ts
import { sendEmail } from './resend-client';
import { CampaignNotificationEmail } from '../../emails/campaigns/campaign-notification';

interface SendCampaignNotificationParams {
  to: string;
  recipientName: string;
  campaign: {
    id: string;
    title: string;
    description: string;
    brandName: string;
    budget: number;
    deadline: string;
    requirements: string[];
  };
  notificationType:
    | 'new_match'
    | 'application_received'
    | 'campaign_approved'
    | 'campaign_completed';
}

export async function sendCampaignNotification({
  to,
  recipientName,
  campaign,
  notificationType,
}: SendCampaignNotificationParams) {
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign.id}`;

  const subjectMap = {
    new_match: `새로운 캠페인 매칭: ${campaign.title}`,
    application_received: `캠페인 지원서 접수: ${campaign.title}`,
    campaign_approved: `캠페인 승인 완료: ${campaign.title}`,
    campaign_completed: `캠페인 완료: ${campaign.title}`,
  };

  return await sendEmail({
    to,
    subject: subjectMap[notificationType],
    react: CampaignNotificationEmail({
      recipientName,
      campaignTitle: campaign.title,
      campaignDescription: campaign.description,
      brandName: campaign.brandName,
      budget: campaign.budget,
      deadline: campaign.deadline,
      requirements: campaign.requirements,
      actionUrl,
      notificationType,
    }),
    tags: ['campaign', notificationType, 'notification'],
  });
}

export async function sendBulkCampaignNotifications(
  notifications: SendCampaignNotificationParams[],
) {
  const results = await Promise.allSettled(
    notifications.map((notification) => sendCampaignNotification(notification)),
  );

  const successful = results.filter((result) => result.status === 'fulfilled').length;
  const failed = results.filter((result) => result.status === 'rejected').length;

  console.log(`대량 캠페인 알림 발송 완료: 성공 ${successful}건, 실패 ${failed}건`);

  return { successful, failed, results };
}

// AI 매칭 기반 개인화된 캠페인 추천 이메일
export async function sendPersonalizedCampaignRecommendations(
  userId: string,
  userEmail: string,
  userName: string,
  recommendations: any[],
) {
  // AI가 분석한 사용자 선호도 기반 캠페인 추천
  // 주간/월간 정기 발송
}
```

### 3. 결제 알림 서비스

```typescript
// lib/email/payment-service.ts
import { sendEmail } from './resend-client';
import { PaymentNotificationEmail } from '../../emails/payments/payment-notification';

interface SendPaymentNotificationParams {
  to: string;
  recipientName: string;
  payment: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    transactionDate: string;
    description: string;
  };
  notificationType: 'success' | 'failed' | 'refund' | 'settlement';
}

export async function sendPaymentNotification({
  to,
  recipientName,
  payment,
  notificationType,
}: SendPaymentNotificationParams) {
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payments/${payment.orderId}`;

  const subjectMap = {
    success: `결제 완료: ${payment.amount.toLocaleString()}원`,
    failed: `결제 실패: ${payment.description}`,
    refund: `환불 완료: ${payment.amount.toLocaleString()}원`,
    settlement: `정산 완료: ${payment.amount.toLocaleString()}원`,
  };

  return await sendEmail({
    to,
    subject: subjectMap[notificationType],
    react: PaymentNotificationEmail({
      recipientName,
      orderId: payment.orderId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.transactionDate,
      description: payment.description,
      notificationType,
      actionUrl,
    }),
    tags: ['payment', notificationType],
  });
}

// 정산 완료 알림 (크리에이터용)
export async function sendSettlementNotification(
  creatorEmail: string,
  creatorName: string,
  settlement: {
    id: string;
    amount: number;
    period: string;
    campaignCount: number;
    transferDate: string;
  },
) {
  return await sendPaymentNotification({
    to: creatorEmail,
    recipientName: creatorName,
    payment: {
      orderId: settlement.id,
      amount: settlement.amount,
      paymentMethod: '계좌이체',
      transactionDate: settlement.transferDate,
      description: `${settlement.period} 크리에이터 수수료 정산 (${settlement.campaignCount}개 캠페인)`,
    },
    notificationType: 'settlement',
  });
}

// 결제 실패 재시도 알림
export async function sendPaymentRetryNotification(
  userEmail: string,
  userName: string,
  failedPayment: {
    orderId: string;
    amount: number;
    failureReason: string;
    retryUrl: string;
  },
) {
  // 결제 실패 시 재시도 안내 이메일
}
```

## 이메일 자동화 및 스케줄링

### 1. 이메일 큐 시스템

```typescript
// lib/email/queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

// 이메일 큐 생성
export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// 이메일 작업 타입 정의
interface EmailJob {
  type: 'welcome' | 'campaign_notification' | 'payment_notification' | 'marketing';
  to: string | string[];
  data: any;
  priority?: number;
  delay?: number;
}

// 이메일 작업 추가
export async function addEmailJob(job: EmailJob) {
  return await emailQueue.add(
    job.type,
    {
      to: job.to,
      data: job.data,
    },
    {
      priority: job.priority || 0,
      delay: job.delay || 0,
    },
  );
}

// 이메일 워커 생성
const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, to, data } = job.data;

    try {
      switch (type) {
        case 'welcome':
          return await sendWelcomeEmail({ to, ...data });
        case 'campaign_notification':
          return await sendCampaignNotification({ to, ...data });
        case 'payment_notification':
          return await sendPaymentNotification({ to, ...data });
        case 'marketing':
          return await sendMarketingEmail({ to, ...data });
        default:
          throw new Error(`알 수 없는 이메일 타입: ${type}`);
      }
    } catch (error) {
      console.error(`이메일 발송 실패 (${type}):`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // 동시 처리 작업 수
  },
);

// 이벤트 리스너
emailWorker.on('completed', (job) => {
  console.log(`이메일 발송 완료: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`이메일 발송 실패: ${job?.id}`, err);
});

// 스케줄된 이메일 (예: 주간 리포트)
export async function scheduleWeeklyReport() {
  return await emailQueue.add(
    'weekly_report',
    {},
    {
      repeat: {
        pattern: '0 9 * * 1', // 매주 월요일 오전 9시
        tz: 'Asia/Seoul',
      },
    },
  );
}
```

### 2. 이메일 템플릿 관리

```typescript
// lib/email/template-manager.ts
import { render } from '@react-email/render';
import { LRUCache } from 'lru-cache';

// 템플릿 캐시
const templateCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 30, // 30분
});

interface TemplateData {
  [key: string]: any;
}

export class EmailTemplateManager {
  private templates: Map<string, React.ComponentType<any>> = new Map();

  // 템플릿 등록
  registerTemplate(name: string, component: React.ComponentType<any>) {
    this.templates.set(name, component);
  }

  // 템플릿 렌더링
  async renderTemplate(name: string, data: TemplateData): Promise<string> {
    const cacheKey = `${name}_${JSON.stringify(data)}`;

    // 캐시에서 확인
    const cached = templateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const TemplateComponent = this.templates.get(name);
    if (!TemplateComponent) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${name}`);
    }

    try {
      const html = render(TemplateComponent(data));
      templateCache.set(cacheKey, html);
      return html;
    } catch (error) {
      console.error(`템플릿 렌더링 오류 (${name}):`, error);
      throw error;
    }
  }

  // 템플릿 미리보기 (개발용)
  async previewTemplate(name: string, data: TemplateData) {
    return await this.renderTemplate(name, data);
  }

  // 등록된 템플릿 목록
  getTemplateList(): string[] {
    return Array.from(this.templates.keys());
  }
}

// 전역 템플릿 매니저 인스턴스
export const templateManager = new EmailTemplateManager();

// 기본 템플릿 등록
import { WelcomeEmail } from '../../emails/auth/welcome-email';
import { PasswordResetEmail } from '../../emails/auth/password-reset-email';
import { CampaignNotificationEmail } from '../../emails/campaigns/campaign-notification';
import { PaymentNotificationEmail } from '../../emails/payments/payment-notification';

templateManager.registerTemplate('welcome', WelcomeEmail);
templateManager.registerTemplate('password-reset', PasswordResetEmail);
templateManager.registerTemplate('campaign-notification', CampaignNotificationEmail);
templateManager.registerTemplate('payment-notification', PaymentNotificationEmail);
```

## 성능 최적화 및 모니터링

### 1. 이메일 전송 모니터링

```typescript
// lib/email/monitoring.ts
import { performance } from 'perf_hooks';

interface EmailMetrics {
  templateName: string;
  recipientCount: number;
  sendDuration: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

class EmailMonitor {
  private metrics: EmailMetrics[] = [];

  async trackEmailSend<T>(
    templateName: string,
    recipientCount: number,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();

      const duration = performance.now() - startTime;
      this.recordMetric({
        templateName,
        recipientCount,
        sendDuration: duration,
        success: true,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        templateName,
        recipientCount,
        sendDuration: duration,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private recordMetric(metric: EmailMetrics) {
    this.metrics.push(metric);

    // 메트릭 제한
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // 실시간 알림
    if (metric.sendDuration > 5000) {
      // 5초 이상
      this.alertSlowEmail(metric);
    }

    if (!metric.success) {
      this.alertEmailFailure(metric);
    }
  }

  private alertSlowEmail(metric: EmailMetrics) {
    console.warn('느린 이메일 전송 감지:', {
      template: metric.templateName,
      duration: `${metric.sendDuration.toFixed(2)}ms`,
      recipients: metric.recipientCount,
    });
  }

  private alertEmailFailure(metric: EmailMetrics) {
    console.error('이메일 전송 실패:', {
      template: metric.templateName,
      error: metric.errorMessage,
      recipients: metric.recipientCount,
    });
  }

  getMetrics() {
    const totalEmails = this.metrics.length;
    const successfulEmails = this.metrics.filter((m) => m.success).length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.sendDuration, 0) / totalEmails;

    return {
      totalEmails,
      successRate: successfulEmails / totalEmails,
      averageDuration,
      templateStats: this.getTemplateStats(),
    };
  }

  private getTemplateStats() {
    const stats: Record<string, { count: number; successRate: number }> = {};

    this.metrics.forEach((metric) => {
      if (!stats[metric.templateName]) {
        stats[metric.templateName] = { count: 0, successRate: 0 };
      }
      stats[metric.templateName].count++;
    });

    Object.keys(stats).forEach((template) => {
      const templateMetrics = this.metrics.filter((m) => m.templateName === template);
      const successful = templateMetrics.filter((m) => m.success).length;
      stats[template].successRate = successful / templateMetrics.length;
    });

    return stats;
  }
}

export const emailMonitor = new EmailMonitor();
```

### 2. 이메일 전송 최적화

```typescript
// lib/email/optimization.ts
import { LRUCache } from 'lru-cache';

// 수신자 검증 캐시
const emailValidationCache = new LRUCache<string, boolean>({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24, // 24시간
});

// 이메일 주소 검증
export function validateEmail(email: string): boolean {
  const cached = emailValidationCache.get(email);
  if (cached !== undefined) {
    return cached;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  emailValidationCache.set(email, isValid);
  return isValid;
}

// 대량 이메일 전송 최적화
export async function sendBulkEmails(
  emails: Array<{
    to: string;
    subject: string;
    react: React.ReactElement;
    tags?: string[];
  }>,
  batchSize: number = 50,
) {
  const results = [];

  // 유효한 이메일만 필터링
  const validEmails = emails.filter((email) => validateEmail(email.to));

  // 배치 단위로 처리
  for (let i = 0; i < validEmails.length; i += batchSize) {
    const batch = validEmails.slice(i, i + batchSize);

    const batchPromises = batch.map((email) =>
      sendEmail(email).catch((error) => ({ error, email: email.to })),
    );

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);

    // 배치 간 지연 (API 제한 방지)
    if (i + batchSize < validEmails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// 이메일 전송 빈도 제한
const rateLimitCache = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1시간
});

export function checkRateLimit(email: string, maxPerHour: number = 10): boolean {
  const current = rateLimitCache.get(email) || 0;

  if (current >= maxPerHour) {
    return false;
  }

  rateLimitCache.set(email, current + 1);
  return true;
}

// 이메일 중복 제거
export function deduplicateEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map((email) => email.toLowerCase())));
}
```

## 테스트 및 디버깅

### 1. 이메일 테스트 도구

```typescript
// lib/email/test-utils.ts
import { render } from '@react-email/render';

// 테스트용 이메일 주소
export const testEmails = {
  valid: 'test@example.com',
  invalid: 'invalid-email',
  bounce: 'bounce@simulator.amazonses.com',
  complaint: 'complaint@simulator.amazonses.com',
};

// 이메일 템플릿 테스트
export async function testEmailTemplate(TemplateComponent: React.ComponentType<any>, props: any) {
  try {
    const html = render(TemplateComponent(props));

    // HTML 유효성 검사
    const hasRequiredElements = [
      html.includes('<html'),
      html.includes('<body'),
      html.includes('</html>'),
      html.includes('</body>'),
    ].every(Boolean);

    if (!hasRequiredElements) {
      throw new Error('필수 HTML 요소가 누락되었습니다');
    }

    return {
      success: true,
      html,
      size: html.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 이메일 전송 시뮬레이션
export async function simulateEmailSend(to: string, subject: string, template: React.ReactElement) {
  console.log('=== 이메일 전송 시뮬레이션 ===');
  console.log(`받는 사람: ${to}`);
  console.log(`제목: ${subject}`);
  console.log('템플릿 렌더링 중...');

  const result = await testEmailTemplate(() => template, {});

  if (result.success) {
    console.log(`✅ 템플릿 렌더링 성공 (크기: ${result.size} bytes)`);
    console.log('HTML 미리보기:');
    console.log(result.html?.substring(0, 200) + '...');
  } else {
    console.log(`❌ 템플릿 렌더링 실패: ${result.error}`);
  }

  return result;
}

// 이메일 성능 테스트
export async function performanceTest(emailCount: number = 100) {
  const startTime = performance.now();

  const promises = Array.from({ length: emailCount }, (_, i) =>
    simulateEmailSend(
      `test${i}@example.com`,
      `테스트 이메일 ${i + 1}`,
      React.createElement('div', {}, `테스트 내용 ${i + 1}`),
    ),
  );

  const results = await Promise.allSettled(promises);
  const endTime = performance.now();

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    totalEmails: emailCount,
    successful,
    failed,
    duration: endTime - startTime,
    averageTime: (endTime - startTime) / emailCount,
  };
}
```

## API 라우트 구현

### 1. 이메일 전송 API

```typescript
// app/api/emails/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend-client';
import { templateManager } from '@/lib/email/template-manager';
import { validateEmail, checkRateLimit } from '@/lib/email/optimization';
import { emailMonitor } from '@/lib/email/monitoring';

export async function POST(request: NextRequest) {
  try {
    const { to, templateName, data, priority = 0 } = await request.json();

    // 입력 검증
    if (!to || !templateName || !data) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 });
    }

    // 이메일 주소 검증
    const recipients = Array.isArray(to) ? to : [to];
    const invalidEmails = recipients.filter((email) => !validateEmail(email));

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: '유효하지 않은 이메일 주소', invalidEmails },
        { status: 400 },
      );
    }

    // 전송 빈도 제한 확인
    for (const email of recipients) {
      if (!checkRateLimit(email)) {
        return NextResponse.json({ error: '전송 빈도 제한 초과', email }, { status: 429 });
      }
    }

    // 템플릿 렌더링 및 이메일 전송
    const result = await emailMonitor.trackEmailSend(templateName, recipients.length, async () => {
      const html = await templateManager.renderTemplate(templateName, data);

      return await sendEmail({
        to: recipients,
        subject: data.subject || '알림',
        react: html,
        tags: [templateName, 'api'],
      });
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('이메일 전송 API 오류:', error);
    return NextResponse.json({ error: '이메일 전송 실패' }, { status: 500 });
  }
}

// 이메일 템플릿 미리보기 API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateName = searchParams.get('template');
  const dataParam = searchParams.get('data');

  if (!templateName) {
    return NextResponse.json({ error: '템플릿 이름이 필요합니다' }, { status: 400 });
  }

  try {
    const data = dataParam ? JSON.parse(dataParam) : {};
    const html = await templateManager.renderTemplate(templateName, data);

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('템플릿 미리보기 오류:', error);
    return NextResponse.json({ error: '템플릿 렌더링 실패' }, { status: 500 });
  }
}
```

### 2. 이메일 상태 확인 API

```typescript
// app/api/emails/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/email/resend-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get('id');

  if (!emailId) {
    return NextResponse.json({ error: '이메일 ID가 필요합니다' }, { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.get(emailId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ email: data });
  } catch (error) {
    console.error('이메일 상태 확인 오류:', error);
    return NextResponse.json({ error: '상태 확인 실패' }, { status: 500 });
  }
}
```

### 3. 웹훅 처리 API

```typescript
// app/api/emails/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('resend-signature');

    if (!signature) {
      return NextResponse.json({ error: '서명이 없습니다' }, { status: 401 });
    }

    // 웹훅 서명 검증
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: '유효하지 않은 서명' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 이벤트 타입별 처리
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(event.data);
        break;
      case 'email.delivered':
        await handleEmailDelivered(event.data);
        break;
      case 'email.delivery_delayed':
        await handleEmailDelayed(event.data);
        break;
      case 'email.complained':
        await handleEmailComplaint(event.data);
        break;
      case 'email.bounced':
        await handleEmailBounce(event.data);
        break;
      default:
        console.log('알 수 없는 이벤트 타입:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json({ error: '웹훅 처리 실패' }, { status: 500 });
  }
}

async function handleEmailSent(data: any) {
  console.log('이메일 전송됨:', data.email_id);
  // 데이터베이스에 전송 상태 업데이트
}

async function handleEmailDelivered(data: any) {
  console.log('이메일 배달됨:', data.email_id);
  // 배달 완료 상태 업데이트
}

async function handleEmailDelayed(data: any) {
  console.log('이메일 지연됨:', data.email_id);
  // 지연 알림 처리
}

async function handleEmailComplaint(data: any) {
  console.log('이메일 신고됨:', data.email_id);
  // 수신거부 처리 및 블랙리스트 추가
}

async function handleEmailBounce(data: any) {
  console.log('이메일 반송됨:', data.email_id);
  // 반송된 이메일 주소 처리
}
```

## 보안 및 규정 준수

### 1. 개인정보 보호

```typescript
// lib/email/privacy.ts
import crypto from 'crypto';

// 이메일 주소 마스킹
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }

  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
  return `${maskedLocal}@${domain}`;
}

// 이메일 주소 해싱 (분석용)
export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

// 수신거부 토큰 생성
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET!;
  const data = `${email}:${Date.now()}`;

  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// 수신거부 토큰 검증
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET!;
  const data = `${email}:${Date.now()}`;

  const expectedToken = crypto.createHmac('sha256', secret).update(data).digest('hex');

  return token === expectedToken;
}

// GDPR 준수 - 개인정보 삭제
export async function deleteUserEmailData(userId: string) {
  // 이메일 로그 삭제
  // 구독 정보 삭제
  // 캐시된 데이터 삭제
  console.log(`사용자 ${userId}의 이메일 데이터 삭제 완료`);
}
```

### 2. 스팸 방지

```typescript
// lib/email/spam-prevention.ts
import { LRUCache } from 'lru-cache';

// IP별 전송 제한
const ipRateLimit = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1시간
});

// 의심스러운 활동 감지
const suspiciousActivity = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 24, // 24시간
});

export function checkSpamRisk(
  email: string,
  ipAddress: string,
  content: string,
): { isSpam: boolean; reason?: string } {
  // IP 기반 제한 확인
  const ipCount = ipRateLimit.get(ipAddress) || 0;
  if (ipCount > 100) {
    // 시간당 100개 제한
    return { isSpam: true, reason: 'IP 전송 제한 초과' };
  }

  // 의심스러운 키워드 검사
  const spamKeywords = ['무료', '당첨', '긴급', '클릭하세요', '지금 구매'];
  const hasSpamKeywords = spamKeywords.some((keyword) => content.toLowerCase().includes(keyword));

  if (hasSpamKeywords) {
    return { isSpam: true, reason: '스팸 키워드 감지' };
  }

  // 동일 이메일 반복 전송 확인
  const emailKey = `${email}:${content.substring(0, 100)}`;
  const duplicateCount = suspiciousActivity.get(emailKey) || 0;

  if (duplicateCount > 3) {
    return { isSpam: true, reason: '중복 이메일 감지' };
  }

  // 카운터 증가
  ipRateLimit.set(ipAddress, ipCount + 1);
  suspiciousActivity.set(emailKey, duplicateCount + 1);

  return { isSpam: false };
}

// 블랙리스트 관리
const emailBlacklist = new Set<string>();
const domainBlacklist = new Set<string>();

export function addToBlacklist(email: string) {
  emailBlacklist.add(email.toLowerCase());
}

export function addDomainToBlacklist(domain: string) {
  domainBlacklist.add(domain.toLowerCase());
}

export function isBlacklisted(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const domain = normalizedEmail.split('@')[1];

  return emailBlacklist.has(normalizedEmail) || domainBlacklist.has(domain);
}
```

## 문제 해결 가이드

### 1. 일반적인 문제

| 문제               | 원인                         | 해결방법                            |
| ------------------ | ---------------------------- | ----------------------------------- |
| API 키 오류        | 잘못된 또는 만료된 API 키    | `.env` 파일의 `RESEND_API_KEY` 확인 |
| 템플릿 렌더링 실패 | React 컴포넌트 오류          | 템플릿 구문 및 props 확인           |
| 이메일 전송 실패   | 네트워크 또는 서버 오류      | 재시도 로직 구현 및 로그 확인       |
| 느린 전송 속도     | 대량 이메일 처리             | 배치 처리 및 큐 시스템 사용         |
| 스팸 필터링        | 이메일 내용 또는 발신자 문제 | SPF, DKIM, DMARC 설정 확인          |

### 2. 디버깅 도구

```typescript
// lib/email/debug.ts
export function debugEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  console.log('=== 이메일 디버그 정보 ===');
  console.log(`받는 사람: ${to}`);
  console.log(`제목: ${subject}`);
  console.log(`템플릿: ${template}`);
  console.log('데이터:', JSON.stringify(data, null, 2));
  console.log('환경 변수:');
  console.log(`- RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '설정됨' : '미설정'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('================================');
}

// 이메일 전송 로그
export function logEmailSend(result: any) {
  if (result.success) {
    console.log(`✅ 이메일 전송 성공: ${result.id}`);
  } else {
    console.error(`❌ 이메일 전송 실패: ${result.error}`);
  }
}
```

## 모범 사례

### 1. 성능 최적화

- **템플릿 캐싱**: 자주 사용되는 템플릿은 메모리에 캐시
- **배치 처리**: 대량 이메일은 배치 단위로 처리
- **비동기 처리**: 큐 시스템을 사용한 백그라운드 처리
- **이미지 최적화**: 이메일 내 이미지는 CDN 사용

### 2. 보안 강화

- **API 키 보안**: 환경 변수로 관리, 정기적 교체
- **입력 검증**: 모든 사용자 입력 검증
- **전송 제한**: IP 및 사용자별 전송 빈도 제한
- **웹훅 검증**: 서명을 통한 웹훅 무결성 확인

### 3. 사용자 경험

- **반응형 디자인**: 모든 디바이스에서 최적화된 표시
- **접근성**: 스크린 리더 호환성 확보
- **다국어 지원**: 사용자 언어 설정에 따른 템플릿 제공
- **수신거부**: 쉬운 수신거부 링크 제공

## 참고 자료

- [Resend 공식 문서](https://resend.com/docs)
- [React Email 문서](https://react.email/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [이메일 보안 가이드](https://resend.com/docs/knowledge-base/email-security)
- [GDPR 준수 가이드](https://resend.com/docs/knowledge-base/gdpr-compliance)
