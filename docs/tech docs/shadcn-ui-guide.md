# Shadcn/ui 컴포넌트 라이브러리 가이드

## 개요

Shadcn/ui는 CashUp 프로젝트의 UI 컴포넌트 라이브러리로, Radix UI와 Tailwind CSS를 기반으로 한 재사용 가능한 컴포넌트 시스템입니다. 복사-붙여넣기 방식으로 컴포넌트를 프로젝트에 추가하여 완전한 커스터마이징이 가능합니다.

### 주요 특징

- **접근성 우선**: Radix UI 기반으로 WAI-ARIA 표준 준수
- **커스터마이징**: 완전한 소스 코드 제어 및 수정 가능
- **타입 안전성**: TypeScript로 작성된 타입 안전한 컴포넌트
- **테마 지원**: CSS 변수 기반 다크/라이트 모드
- **반응형**: 모바일 우선 반응형 디자인

## 설치 및 설정

### 1. 초기 설정

```bash
# Shadcn/ui CLI 설치
npx shadcn-ui@latest init
```

### 2. 설정 파일

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 3. 글로벌 CSS 설정

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CashUp 브랜드 컬러 */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%; /* CashUp 블루 */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;

    /* CashUp 커스텀 컬러 */
    --cashup-blue: 221.2 83.2% 53.3%;
    --cashup-green: 142.1 76.2% 36.3%;
    --cashup-orange: 24.6 95% 53.1%;
    --cashup-purple: 262.1 83.3% 57.8%;
    --cashup-gray: 215 16.3% 46.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings:
      'rlig' 1,
      'calt' 1;
  }
}

/* CashUp 커스텀 유틸리티 */
@layer utilities {
  .text-cashup-blue {
    color: hsl(var(--cashup-blue));
  }
  .bg-cashup-blue {
    background-color: hsl(var(--cashup-blue));
  }
  .border-cashup-blue {
    border-color: hsl(var(--cashup-blue));
  }

  .text-cashup-green {
    color: hsl(var(--cashup-green));
  }
  .bg-cashup-green {
    background-color: hsl(var(--cashup-green));
  }

  .text-cashup-orange {
    color: hsl(var(--cashup-orange));
  }
  .bg-cashup-orange {
    background-color: hsl(var(--cashup-orange));
  }

  .text-cashup-purple {
    color: hsl(var(--cashup-purple));
  }
  .bg-cashup-purple {
    background-color: hsl(var(--cashup-purple));
  }
}
```

### 4. 유틸리티 함수

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CashUp 특화 유틸리티
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat('ko-KR', { numeric: 'auto' });
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'second');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return rtf.format(diffInDays, 'day');
}
```

## 핵심 컴포넌트

### 1. 기본 컴포넌트 설치

```bash
# 자주 사용되는 컴포넌트들
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
```

### 2. 버튼 컴포넌트 커스터마이징

```typescript
// components/ui/button.tsx (수정된 버전)
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // CashUp 커스텀 변형
        cashup: "bg-cashup-blue text-white shadow hover:bg-cashup-blue/90",
        success: "bg-cashup-green text-white shadow hover:bg-cashup-green/90",
        warning: "bg-cashup-orange text-white shadow hover:bg-cashup-orange/90",
        purple: "bg-cashup-purple text-white shadow hover:bg-cashup-purple/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 3. 카드 컴포넌트 확장

```typescript
// components/ui/card.tsx (확장된 버전)
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "shadow-lg border-0",
        outlined: "border-2 shadow-none",
        filled: "bg-muted border-0",
        // CashUp 특화 변형
        campaign: "border-cashup-blue/20 bg-gradient-to-br from-blue-50 to-white",
        creator: "border-cashup-green/20 bg-gradient-to-br from-green-50 to-white",
        business: "border-cashup-orange/20 bg-gradient-to-br from-orange-50 to-white",
        analytics: "border-cashup-purple/20 bg-gradient-to-br from-purple-50 to-white",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size }),
        hover && "transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### 4. 폼 컴포넌트 시스템

```typescript
// components/ui/form-field.tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  required?: boolean
  error?: string
  description?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  error,
  description,
  value,
  onChange,
  className,
  disabled,
}: FormFieldProps) {
  const id = `field-${name}`

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </Label>

      {type === 'textarea' ? (
        <Textarea
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(error && "border-red-500 focus:border-red-500")}
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(error && "border-red-500 focus:border-red-500")}
        />
      )}

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
```

## CashUp 특화 컴포넌트

### 1. 캠페인 카드 컴포넌트

```typescript
// components/campaign/campaign-card.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { Calendar, MapPin, Users, DollarSign } from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  location: string
  category: string
  status: 'active' | 'pending' | 'completed' | 'cancelled'
  applicants: number
  maxApplicants: number
  business: {
    name: string
    logo: string
  }
}

interface CampaignCardProps {
  campaign: Campaign
  onApply?: (campaignId: string) => void
  onView?: (campaignId: string) => void
  showActions?: boolean
}

export function CampaignCard({
  campaign,
  onApply,
  onView,
  showActions = true
}: CampaignCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    active: '진행중',
    pending: '대기중',
    completed: '완료',
    cancelled: '취소됨',
  }

  return (
    <Card variant="campaign" hover className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={campaign.business.logo} alt={campaign.business.name} />
              <AvatarFallback>{campaign.business.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{campaign.business.name}</p>
              <Badge variant="outline" className="text-xs">
                {campaign.category}
              </Badge>
            </div>
          </div>
          <Badge className={statusColors[campaign.status]}>
            {statusLabels[campaign.status]}
          </Badge>
        </div>

        <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {campaign.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-cashup-green" />
            <span className="font-medium">{formatCurrency(campaign.budget)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-cashup-blue" />
            <span>{formatRelativeTime(campaign.deadline)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-cashup-orange" />
            <span className="truncate">{campaign.location}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-cashup-purple" />
            <span>{campaign.applicants}/{campaign.maxApplicants}</span>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>지원자 현황</span>
            <span>{Math.round((campaign.applicants / campaign.maxApplicants) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-cashup-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(campaign.applicants / campaign.maxApplicants) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onView?.(campaign.id)}
          >
            자세히 보기
          </Button>

          {campaign.status === 'active' && campaign.applicants < campaign.maxApplicants && (
            <Button
              variant="cashup"
              className="flex-1"
              onClick={() => onApply?.(campaign.id)}
            >
              지원하기
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
```

### 2. 크리에이터 프로필 카드

```typescript
// components/creator/creator-profile-card.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency } from "@/lib/utils"
import { Instagram, Youtube, TrendingUp, Users, Star } from "lucide-react"

interface Creator {
  id: string
  name: string
  username: string
  avatar: string
  bio: string
  categories: string[]
  followers: {
    instagram?: number
    youtube?: number
    tiktok?: number
  }
  rating: number
  completedCampaigns: number
  averageRate: number
  isVerified: boolean
}

interface CreatorProfileCardProps {
  creator: Creator
  onContact?: (creatorId: string) => void
  onViewProfile?: (creatorId: string) => void
  showActions?: boolean
}

export function CreatorProfileCard({
  creator,
  onContact,
  onViewProfile,
  showActions = true
}: CreatorProfileCardProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Card variant="creator" hover className="h-full">
      <CardHeader className="text-center">
        <div className="relative mx-auto">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarImage src={creator.avatar} alt={creator.name} />
            <AvatarFallback className="text-lg">{creator.name[0]}</AvatarFallback>
          </Avatar>
          {creator.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
              <Star className="h-3 w-3 text-white fill-current" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{creator.name}</h3>
          <p className="text-sm text-muted-foreground">@{creator.username}</p>
        </div>

        <div className="flex items-center justify-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="font-medium">{creator.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({creator.completedCampaigns})</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-center text-muted-foreground line-clamp-2">
          {creator.bio}
        </p>

        {/* 카테고리 */}
        <div className="flex flex-wrap gap-1 justify-center">
          {creator.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
          {creator.categories.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{creator.categories.length - 3}
            </Badge>
          )}
        </div>

        {/* 소셜 미디어 팔로워 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {creator.followers.instagram && (
            <div className="flex items-center space-x-2 justify-center">
              <Instagram className="h-4 w-4 text-pink-500" />
              <span>{formatFollowers(creator.followers.instagram)}</span>
            </div>
          )}

          {creator.followers.youtube && (
            <div className="flex items-center space-x-2 justify-center">
              <Youtube className="h-4 w-4 text-red-500" />
              <span>{formatFollowers(creator.followers.youtube)}</span>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <TrendingUp className="h-4 w-4 text-cashup-green" />
              <span className="font-medium">{formatCurrency(creator.averageRate)}</span>
            </div>
            <p className="text-xs text-muted-foreground">평균 단가</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Users className="h-4 w-4 text-cashup-blue" />
              <span className="font-medium">{creator.completedCampaigns}</span>
            </div>
            <p className="text-xs text-muted-foreground">완료 캠페인</p>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <div className="p-4 pt-0 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onViewProfile?.(creator.id)}
          >
            프로필 보기
          </Button>

          <Button
            variant="cashup"
            className="w-full"
            onClick={() => onContact?.(creator.id)}
          >
            연락하기
          </Button>
        </div>
      )}
    </Card>
  )
}
```

### 3. 대시보드 통계 카드

```typescript
// components/dashboard/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
  format?: 'number' | 'currency' | 'percentage'
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  variant = 'default',
  format = 'number',
  className,
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val

    switch (format) {
      case 'currency':
        return formatCurrency(numValue)
      case 'percentage':
        return `${numValue}%`
      default:
        return numValue.toLocaleString('ko-KR')
    }
  }

  const variantStyles = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50',
  }

  const iconStyles = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>

        {change && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge
              variant={change.type === 'increase' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                change.type === 'increase'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              )}
            >
              {change.type === 'increase' ? '+' : ''}{change.value}%
            </Badge>
            <p className="text-xs text-muted-foreground">
              {change.period} 대비
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4. 데이터 테이블 컴포넌트

```typescript
// components/ui/data-table.tsx
import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "검색...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      {/* 검색 */}
      {searchKey && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          총 {table.getFilteredRowModel().rows.length}개 중{" "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}개 표시
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>

          <div className="text-sm font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## 테마 및 다크 모드

### 1. 테마 프로바이더

```typescript
// components/theme/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### 2. 테마 토글 컴포넌트

```typescript
// components/theme/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          라이트 모드
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          다크 모드
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          시스템 설정
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 3. 루트 레이아웃에 테마 적용

```typescript
// app/layout.tsx
import { ThemeProvider } from "@/components/theme/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## 반응형 디자인

### 1. 반응형 유틸리티

```typescript
// hooks/use-responsive.ts
import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isBreakpoint = (breakpoint: Breakpoint) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  return {
    windowSize,
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
}
```

### 2. 반응형 컨테이너

```typescript
// components/layout/responsive-container.tsx
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}
```

## 접근성 (Accessibility)

### 1. 접근성 유틸리티

```typescript
// lib/accessibility.ts
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTabKey(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    if (e.key === 'Escape') {
      element.dispatchEvent(new CustomEvent('escape'));
    }
  }

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}
```

### 2. 접근성 개선된 컴포넌트

```typescript
// components/ui/accessible-button.tsx
import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string
  ariaDescribedBy?: string
  announceOnClick?: string
}

export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(({
  ariaLabel,
  ariaDescribedBy,
  announceOnClick,
  onClick,
  children,
  className,
  ...props
}, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick) {
      // 스크린 리더에 알림
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('class', 'sr-only')
      announcement.textContent = announceOnClick
      document.body.appendChild(announcement)

      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }

    onClick?.(e)
  }

  return (
    <Button
      ref={ref}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={handleClick}
      className={cn(
        "focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
})

AccessibleButton.displayName = "AccessibleButton"
```

## 성능 최적화

### 1. 지연 로딩 컴포넌트

```typescript
// components/ui/lazy-components.tsx
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// 무거운 컴포넌트들을 지연 로딩
const LazyDataTable = lazy(() => import('@/components/ui/data-table').then(mod => ({ default: mod.DataTable })))
const LazyChart = lazy(() => import('@/components/charts/chart').then(mod => ({ default: mod.Chart })))
const LazyRichTextEditor = lazy(() => import('@/components/ui/rich-text-editor'))

export function LazyDataTableWrapper(props: any) {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <LazyDataTable {...props} />
    </Suspense>
  )
}

export function LazyChartWrapper(props: any) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LazyChart {...props} />
    </Suspense>
  )
}

export function LazyRichTextEditorWrapper(props: any) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <LazyRichTextEditor {...props} />
    </Suspense>
  )
}

// 스켈레톤 컴포넌트들
function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />
}

function EditorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
```

### 2. 메모이제이션 훅

```typescript
// hooks/use-memoized-components.ts
import { useMemo } from 'react'
import { CampaignCard } from '@/components/campaign/campaign-card'
import { CreatorProfileCard } from '@/components/creator/creator-profile-card'

export function useMemoizedCampaignCard(campaign: any, dependencies: any[]) {
  return useMemo(
    () => <CampaignCard campaign={campaign} />,
    [campaign.id, campaign.status, ...dependencies]
  )
}

export function useMemoizedCreatorCard(creator: any, dependencies: any[]) {
  return useMemo(
    () => <CreatorProfileCard creator={creator} />,
    [creator.id, creator.rating, ...dependencies]
  )
}
```

## 문제 해결 가이드

### 1. 일반적인 문제

| 문제                   | 원인                   | 해결방법                              |
| ---------------------- | ---------------------- | ------------------------------------- |
| 스타일이 적용되지 않음 | Tailwind CSS 설정 오류 | `tailwind.config.js` 및 CSS 파일 확인 |
| 컴포넌트 타입 오류     | TypeScript 타입 불일치 | 컴포넌트 props 타입 정의 확인         |
| 다크 모드 깜빡임       | 하이드레이션 불일치    | `suppressHydrationWarning` 추가       |
| 접근성 경고            | ARIA 속성 누락         | 적절한 ARIA 라벨 및 역할 추가         |
| 성능 저하              | 불필요한 리렌더링      | `useMemo`, `useCallback` 사용         |

### 2. 디버깅 도구

```typescript
// lib/debug-ui.ts
export function debugComponent(componentName: string, props: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎨 [UI] ${componentName}:`, props);
  }
}

export function measureRenderTime(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();

    return () => {
      const end = performance.now();
      console.log(`⏱️ [RENDER] ${componentName}: ${(end - start).toFixed(2)}ms`);
    };
  }

  return () => {};
}
```

## 모범 사례

### 1. 컴포넌트 설계

- **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 목적을 가져야 함
- **재사용성**: 공통 패턴을 추출하여 재사용 가능한 컴포넌트 생성
- **타입 안전성**: 모든 props에 대한 TypeScript 타입 정의
- **접근성**: WAI-ARIA 가이드라인 준수

### 2. 성능 최적화

- **지연 로딩**: 무거운 컴포넌트는 필요할 때만 로드
- **메모이제이션**: 불필요한 리렌더링 방지
- **번들 크기**: 사용하지 않는 컴포넌트 제거
- **이미지 최적화**: Next.js Image 컴포넌트 활용

### 3. 유지보수성

- **일관된 네이밍**: 명확하고 일관된 컴포넌트 및 props 네이밍
- **문서화**: 복잡한 컴포넌트에 대한 JSDoc 주석 작성
- **테스트**: 중요한 컴포넌트에 대한 단위 테스트 작성
- **버전 관리**: 컴포넌트 변경 시 적절한 버전 관리

### 4. CashUp 브랜딩

- **색상 일관성**: CashUp 브랜드 컬러 사용
- **타이포그래피**: 일관된 폰트 및 텍스트 스타일
- **아이콘**: Lucide React 아이콘 라이브러리 활용
- **애니메이션**: 부드러운 전환 효과 적용

## 참고 자료

- [Shadcn/ui 공식 문서](https://ui.shadcn.com/)
- [Radix UI 문서](https://www.radix-ui.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Tanstack Table](https://tanstack.com/table/)
- [Next.js 문서](https://nextjs.org/docs)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
