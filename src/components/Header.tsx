import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { IoChevronBack, IoLogOutOutline, IoGlobeOutline } from 'react-icons/io5';

const Header = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-white shadow-md">
      <button
        onClick={() => navigate(-1)}
        className="text-2xl text-gray-600 hover:text-gray-900"
      >
        <IoChevronBack />
      </button>
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-2xl text-gray-600 hover:text-gray-900">
          <IoGlobeOutline />
        </Link>
        <button
          onClick={handleLogout}
          className="text-2xl text-gray-600 hover:text-gray-900"
        >
          <IoLogOutOutline />
        </button>
      </div>
    </header>
  );
};

export default Header; 