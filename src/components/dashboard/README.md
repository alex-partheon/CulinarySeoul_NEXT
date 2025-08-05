# Dashboard Components

CulinarySeoul ERP 대시보드를 위한 재사용 가능한 컴포넌트 모음입니다.

## 컴포넌트 목록

### 1. MetricCard

KPI 메트릭을 표시하는 카드 컴포넌트

```tsx
import { MetricCard } from '@/components/dashboard';

<MetricCard
  title="Total Revenue"
  value={1250.0}
  prefix="$"
  change={12.5}
  changeLabel="Trending up this month"
  subtext="Compared to last month"
  variant="primary" // primary | success | warning | danger
  animate={true}
/>;
```

**특징:**

- 애니메이션 숫자 카운터
- 변화율 표시 (증가/감소 아이콘)
- 4가지 색상 변형
- Framer Motion 애니메이션

### 2. AreaChart

시계열 데이터를 위한 영역 차트

```tsx
import { AreaChart } from '@/components/dashboard';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  // ...
];

<AreaChart
  data={data}
  title="Revenue Overview"
  height={350}
  color="#6366f1"
  showTimeFilter={true}
  onTimeRangeChange={(range) => console.log(range)}
/>;
```

**특징:**

- 보라색 그라디언트 채우기
- 시간대 선택 필터 (7일, 30일, 3개월)
- 반응형 컨테이너
- 커스텀 툴팁

### 3. DataTable

정렬 및 페이지네이션이 가능한 데이터 테이블

```tsx
import { DataTable, renderTag, renderBadge } from '@/components/dashboard';

const columns = [
  { key: 'name', header: 'Name' },
  {
    key: 'status',
    header: 'Status',
    render: (value) => renderTag(value, 'purple'),
  },
  {
    key: 'count',
    header: 'Count',
    render: (value) => renderBadge(value),
  },
];

<DataTable
  data={data}
  columns={columns}
  pageSize={10}
  actions={[
    { label: 'Edit', onClick: (row) => handleEdit(row) },
    { label: 'Delete', onClick: (row) => handleDelete(row) },
  ]}
/>;
```

**특징:**

- 커스텀 렌더러 지원
- 액션 메뉴 (점 3개)
- 페이지네이션
- 호버 효과

### 4. StatCard

작은 통계 카드 with 스파크라인

```tsx
import { StatCard } from '@/components/dashboard';

<StatCard
  title="Total Sales"
  value="$12,345"
  change={5.2}
  sparklineData={[10, 20, 15, 25, 30, 35, 40]}
/>;
```

**특징:**

- 컴팩트한 디자인
- 스파크라인 차트
- 변화율 표시

### 5. CalendarWidget

월간 캘린더 위젯

```tsx
import { CalendarWidget } from '@/components/dashboard';

const activityData = {
  '2025-06-01': 0.8,
  '2025-06-02': 0.6,
  // ...
};

<CalendarWidget
  selectedDates={[new Date('2025-06-15')]}
  goal={{ label: 'Move Goal', value: '350 CALORIES/DAY' }}
  activityData={activityData}
  onDateSelect={(date) => handleDateSelect(date)}
/>;
```

**특징:**

- 월간 뷰
- 선택된 날짜 하이라이트
- 활동량 바 차트
- 목표 표시

### 6. PaymentTable

결제 상태 테이블

```tsx
import { PaymentTable } from '@/components/dashboard';

const paymentData = [
  {
    id: '1',
    status: 'success',
    email: 'user@example.com',
    amount: 1250.0,
    date: new Date(),
  },
  // ...
];

<PaymentTable
  data={paymentData}
  onRowClick={(payment) => handlePaymentClick(payment)}
  actions={[
    { label: 'View Details', onClick: (payment) => viewDetails(payment) },
    { label: 'Refund', onClick: (payment) => refund(payment) },
  ]}
/>;
```

**특징:**

- 상태별 색상 배지
- 금액 포맷팅
- 날짜 표시
- 액션 메뉴

## 디자인 시스템

### 색상

- **Primary**: #6366f1 (보라색)
- **Success**: 초록색 계열
- **Warning**: 노란색 계열
- **Danger**: 빨간색 계열

### 스타일

- **카드**: 흰색 배경, rounded-2xl, shadow-sm
- **호버**: shadow-md, scale 효과
- **버튼**: 보라색 Primary, 흰색 Secondary
- **폰트**: system-ui

## 사용 예제

전체 예제는 `/app/dashboard/components/page.tsx`에서 확인할 수 있습니다.

```bash
npm run dev
# http://localhost:3000/dashboard/components 접속
```
