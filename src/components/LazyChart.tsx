/**
 * Lazy-loaded chart components wrapper
 * 
 * This module provides lazy-loaded wrappers for Recharts components
 * to reduce initial bundle size. Charts are only loaded when needed.
 * 
 * Requirements:
 * - 7.1: Optimize bundle size through code splitting
 * - 2.3: Use lazy loading for non-critical components
 */

import React, { lazy, Suspense } from 'react';

// Lazy load the entire recharts library
const LazyPieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

const LazyPie = lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);

const LazyCell = lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

const LazyResponsiveContainer = lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

const LazyBar = lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
);

const LazyXAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);

const LazyYAxis = lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);

const LazyTooltip = lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);

const LazyCartesianGrid = lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);

const LazyLegend = lazy(() => 
  import('recharts').then(module => ({ default: module.Legend }))
);

const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

const LazyLine = lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);

// Loading fallback for charts
const ChartLoadingFallback: React.FC = () => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: '8px',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{
      fontSize: '14px',
      color: '#666',
      fontWeight: 500
    }}>
      加载图表中...
    </div>
  </div>
);

// Wrapper components with Suspense
export const PieChart: React.FC<any> = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyPieChart {...props} />
  </Suspense>
);

export const Pie: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyPie {...props} />
  </Suspense>
);

export const Cell: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyCell {...props} />
  </Suspense>
);

export const ResponsiveContainer: React.FC<any> = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyResponsiveContainer {...props} />
  </Suspense>
);

export const BarChart: React.FC<any> = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const Bar: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyBar {...props} />
  </Suspense>
);

export const XAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyXAxis {...props} />
  </Suspense>
);

export const YAxis: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyYAxis {...props} />
  </Suspense>
);

export const Tooltip: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyTooltip {...props} />
  </Suspense>
);

export const CartesianGrid: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyCartesianGrid {...props} />
  </Suspense>
);

export const Legend: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyLegend {...props} />
  </Suspense>
);

export const LineChart: React.FC<any> = (props) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const Line: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyLine {...props} />
  </Suspense>
);
