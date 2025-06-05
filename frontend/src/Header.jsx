import './App.css'
import { Link } from 'react-router-dom';

const navItems = [
  { label: "Calendario", path: "/calendar" },
  { label: "Risultati", path: "/results" },
  { label: "Piloti", path: "/riders" }
];

function Header() {
  return (
    <div className='sticky h-16 top-0 left-0 w-full px-2 shadow-md bg-white flex justify-between items-center'>
        <Link to="/" className="h-full w-auto">
          <img src="./logo_moto_gp.png" alt="logo" className="h-full hover:scale-110 transition-scale duration-300" />
        </Link>
         <div className="float-right">
          <ul className="flex gap-4">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="cursor-pointer hover:text-red-500"
              >
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
    </div>
  );
}

export default Header;
