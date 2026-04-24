import { useEffect } from 'react';
import { useRoutes, useNavigate } from 'react-router-dom';
import { routes } from './routes';

function App() {
  const element = useRoutes(routes);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = () => {
      navigate('/login');
    };

    window.addEventListener('auth_error', handleAuthError);
    return () => {
      window.removeEventListener('auth_error', handleAuthError);
    };
  }, [navigate]);

  return element;
}

export default App;
