/**
 * Tailwind CSS v4 기본 테스트
 * 컴포넌트 렌더링과 기본 클래스 존재 여부 확인
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// 테스트용 컴포넌트
const TestComponent = () => {
  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg" data-testid="test-container">
      <h1 className="text-2xl font-bold">Tailwind CSS Test</h1>
      <p className="mt-2 text-sm">이 텍스트는 Tailwind CSS 스타일이 적용되어야 합니다.</p>
      <button className="mt-4 bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition-colors">
        테스트 버튼
      </button>
    </div>
  );
};

describe('Tailwind CSS v4 기본 테스트', () => {
  test('컴포넌트가 올바르게 렌더링되는지 확인', () => {
    render(<TestComponent />);
    
    // 기본 요소들이 렌더링되는지 확인
    expect(screen.getByText('Tailwind CSS Test')).toBeInTheDocument();
    expect(screen.getByText('이 텍스트는 Tailwind CSS 스타일이 적용되어야 합니다.')).toBeInTheDocument();
    expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
    
    // 컨테이너에 클래스가 적용되었는지 확인
    const container = screen.getByTestId('test-container');
    expect(container).toHaveClass('bg-blue-500', 'text-white', 'p-4', 'rounded-lg');
  });
  
  test('Tailwind CSS 클래스가 DOM에 적용되었는지 확인', () => {
    render(<TestComponent />);
    
    const heading = screen.getByText('Tailwind CSS Test');
    expect(heading).toHaveClass('text-2xl', 'font-bold');
    
    const button = screen.getByText('테스트 버튼');
    expect(button).toHaveClass('mt-4', 'bg-green-500', 'hover:bg-green-600', 'px-4', 'py-2', 'rounded', 'transition-colors');
  });
  
  test('기본 Tailwind CSS 클래스 존재 확인', () => {
    render(<TestComponent />);
    
    // 모든 요소가 예상된 클래스를 가지고 있는지 확인
    const paragraph = screen.getByText('이 텍스트는 Tailwind CSS 스타일이 적용되어야 합니다.');
    expect(paragraph).toHaveClass('mt-2', 'text-sm');
  });
});