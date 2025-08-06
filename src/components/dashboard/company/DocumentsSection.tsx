'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, Plus } from 'lucide-react';

// 문서 데이터 타입
interface Document {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'pending' | 'archived';
  type: string;
}

export const DocumentsSection = React.memo(function DocumentsSection() {
  // 문서 데이터를 메모이제이션으로 최적화
  const documents = useMemo((): Document[] => [
    { id: '1', name: '2024년 3분기 실적 보고서', date: '2024-10-15', status: 'active', type: 'report' },
    { id: '2', name: '밀랍 브랜드 운영 계획서', date: '2024-10-10', status: 'active', type: 'plan' },
    { id: '3', name: '성수점 임대 계약서', date: '2024-09-01', status: 'active', type: 'contract' },
    { id: '4', name: '직원 채용 계획서', date: '2024-10-20', status: 'pending', type: 'hr' },
    { id: '5', name: '재고 관리 매뉴얼', date: '2024-08-15', status: 'active', type: 'manual' },
  ], []);

  // document columns을 메모이제이션으로 최적화
  const documentColumns = useMemo(() => [
    {
      key: 'name' as keyof Document,
      header: '문서명',
      sortable: true,
    },
    {
      key: 'date' as keyof Document,
      header: '날짜',
      sortable: true,
    },
    {
      key: 'status' as keyof Document,
      header: '상태',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : value === 'pending' ? 'secondary' : 'outline'}>
          {value === 'active' ? '활성' : value === 'pending' ? '대기중' : '보관'}
        </Badge>
      ),
    },
    {
      key: 'type' as keyof Document,
      header: '유형',
    },
  ], []);

  return (
    <Card className="p-6 lg:col-span-1">
      <div className="mb-4">
        <Tabs defaultValue="outline" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="outline">개요</TabsTrigger>
            <TabsTrigger value="performance">실적</TabsTrigger>
            <TabsTrigger value="personnel">인사</TabsTrigger>
            <TabsTrigger value="focus">주요</TabsTrigger>
          </TabsList>
          <TabsContent value="outline" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">문서 목록</h4>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Filter className="w-4 h-4 mr-1" />
                    컬럼 설정
                  </Button>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    섹션 추가
                  </Button>
                </div>
              </div>
              <DataTable
                data={documents}
                columns={documentColumns}
                className="max-h-[400px]"
              />
            </div>
          </TabsContent>
          <TabsContent value="performance">
            <p className="text-sm text-gray-500">실적 관련 문서가 여기 표시됩니다.</p>
          </TabsContent>
          <TabsContent value="personnel">
            <p className="text-sm text-gray-500">인사 관련 문서가 여기 표시됩니다.</p>
          </TabsContent>
          <TabsContent value="focus">
            <p className="text-sm text-gray-500">주요 문서가 여기 표시됩니다.</p>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
});

export default DocumentsSection;