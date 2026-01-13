import { useEffect } from 'react';
import { useLoading } from '../contexts/LoadingStateContext';

/**
 * 视图加载状态Hook
 * 自动管理视图的加载状态
 * 
 * @param viewName - 视图名称
 * @param isLoading - 是否正在加载
 * 
 * @example
 * const Home = () => {
 *   const [data, setData] = useState(null);
 *   const [isLoading, setIsLoading] = useState(true);
 *   
 *   // 自动管理加载状态
 *   useViewLoading('home', isLoading);
 *   
 *   useEffect(() => {
 *     fetchData().then(data => {
 *       setData(data);
 *       setIsLoading(false);
 *     });
 *   }, []);
 *   
 *   return <div>...</div>;
 * };
 */
export const useViewLoading = (viewName: string, isLoading: boolean) => {
  const { startLoading, stopLoading } = useLoading(viewName);

  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      stopLoading();
    }

    // 清理函数：组件卸载时停止加载
    return () => {
      stopLoading();
    };
  }, [isLoading, startLoading, stopLoading]);
};
