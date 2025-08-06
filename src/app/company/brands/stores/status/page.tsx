"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Store,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react"
import { useAuth } from "@/lib/supabase/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface StoreStatus {
  id: string
  name: string
  brand_name: string
  status: 'active' | 'inactive' | 'pending'
  monthly_revenue: number
  employee_count: number
  performance_score: number
  last_inspection: string
  issues_count: number
  customer_satisfaction: number
}

interface BrandPerformance {
  brand_name: string
  store_count: number
  avg_revenue: number
  avg_performance: number
  active_stores: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function StoreStatusPage() {
  const { user: _user, profile: _profile } = useAuth()
  const [storeStatuses, setStoreStatuses] = useState<StoreStatus[]>([])
  const [brandPerformances, setBrandPerformances] = useState<BrandPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedBrand, setSelectedBrand] = useState("all")

  const supabase = createClient()

  useEffect(() => {
    fetchStoreStatuses()
    fetchBrandPerformances()
  }, [selectedPeriod, selectedBrand])

  const fetchStoreStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          brands!inner(name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      const formattedData = data?.map(store => ({
        id: store.id,
        name: store.name,
        brand_name: store.brands?.name || '알 수 없음',
        status: 'active' as const, // 임시 데이터
        monthly_revenue: Math.floor(Math.random() * 5000000) + 1000000, // 임시 데이터
        employee_count: Math.floor(Math.random() * 20) + 5, // 임시 데이터
        performance_score: Math.floor(Math.random() * 40) + 60, // 임시 데이터
        last_inspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        issues_count: Math.floor(Math.random() * 5),
        customer_satisfaction: Math.floor(Math.random() * 30) + 70,
      })) || []

      setStoreStatuses(formattedData)
    } catch (error) {
      console.error('매장 현황 데이터 로딩 실패:', {
        message: error instanceof Error ? error.message : String(error),
        error: error
      })
      toast.error('매장 현황 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrandPerformances = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          stores(id, status, monthly_revenue)
        `)
        .eq('status', 'active')

      if (error) throw error

      const performances = data?.map(brand => {
        const stores = brand.stores || []
        const activeStores = stores // 모든 매장을 활성으로 간주
        const totalRevenue = stores.length * (Math.floor(Math.random() * 3000000) + 2000000) // 임시 데이터
        
        return {
          brand_name: brand.name,
          store_count: stores.length,
          avg_revenue: stores.length > 0 ? Math.round(totalRevenue / stores.length) : 0,
          avg_performance: Math.floor(Math.random() * 30) + 70,
          active_stores: activeStores.length,
        }
      }) || []

      setBrandPerformances(performances)
    } catch (error) {
      console.error('브랜드 성과 데이터 로딩 실패:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const totalStores = storeStatuses.length
  const activeStores = storeStatuses.filter(s => s.status === 'active').length
  const avgPerformance = storeStatuses.length > 0 
    ? Math.round(storeStatuses.reduce((sum, s) => sum + s.performance_score, 0) / storeStatuses.length)
    : 0
  const totalIssues = storeStatuses.reduce((sum, s) => sum + s.issues_count, 0)
  const avgSatisfaction = storeStatuses.length > 0
    ? Math.round(storeStatuses.reduce((sum, s) => sum + s.customer_satisfaction, 0) / storeStatuses.length)
    : 0

  // 차트 데이터
  const statusData = [
    { name: '운영중', value: storeStatuses.filter(s => s.status === 'active').length, color: '#00C49F' },
    { name: '휴업', value: storeStatuses.filter(s => s.status === 'inactive').length, color: '#FF8042' },
    { name: '승인대기', value: storeStatuses.filter(s => s.status === 'pending').length, color: '#FFBB28' },
  ]

  const revenueData = brandPerformances.map(brand => ({
    name: brand.brand_name,
    revenue: brand.avg_revenue,
    stores: brand.store_count,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">매장 현황을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매장 현황</h1>
          <p className="text-muted-foreground mt-2">
            전체 매장의 운영 현황과 성과를 모니터링합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">주간</SelectItem>
              <SelectItem value="month">월간</SelectItem>
              <SelectItem value="quarter">분기</SelectItem>
              <SelectItem value="year">연간</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="브랜드 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 브랜드</SelectItem>
              {brandPerformances.map((brand) => (
                <SelectItem key={brand.brand_name} value={brand.brand_name}>
                  {brand.brand_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매장 수</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores}</div>
            <p className="text-xs text-muted-foreground">
              운영중 {activeStores}개
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 성과</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(avgPerformance)}`}>
              {avgPerformance}점
            </div>
            <Progress value={avgPerformance} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">고객 만족도</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction}%</div>
            <Progress value={avgSatisfaction} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">운영 효율성</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStores > 0 ? Math.round((activeStores / totalStores) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              활성 매장 비율
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이슈 현황</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              해결 필요 이슈
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 및 상세 현황 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 매장 상태 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>매장 상태 분포</CardTitle>
            <CardDescription>전체 매장의 운영 상태별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value}개 (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 브랜드별 평균 매출 */}
        <Card>
          <CardHeader>
            <CardTitle>브랜드별 평균 매출</CardTitle>
            <CardDescription>브랜드별 매장 평균 월 매출 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value.toLocaleString()}만원`, 
                      name === 'revenue' ? '평균 매출' : '매장 수'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 매장별 상세 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>매장별 상세 현황</CardTitle>
          <CardDescription>각 매장의 운영 현황과 성과 지표</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storeStatuses.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(store.status)}
                  <div>
                    <h4 className="font-semibold">{store.name}</h4>
                    <p className="text-sm text-muted-foreground">{store.brand_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{store.monthly_revenue.toLocaleString()}만원</p>
                    <p className="text-xs text-muted-foreground">월 매출</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${getPerformanceColor(store.performance_score)}`}>
                      {store.performance_score}점
                    </p>
                    <p className="text-xs text-muted-foreground">성과 점수</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{store.customer_satisfaction}%</p>
                    <p className="text-xs text-muted-foreground">고객 만족도</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{store.employee_count}명</p>
                    <p className="text-xs text-muted-foreground">직원 수</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      store.issues_count > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {store.issues_count}건
                    </p>
                    <p className="text-xs text-muted-foreground">이슈</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}