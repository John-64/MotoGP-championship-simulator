import './App.css'
import { Link } from 'react-router-dom';
import motogp from './assets/motogp.png'

const navItems = [
  { label: "Risultati", path: "/results" },
  { label: "Circuiti", path: "/track" },
  { label: "Piloti", path: "/riders" }

];

function Header() {
  return (
    <div className='sticky h-16 top-0 left-0 w-full px-5 shadow-md bg-black flex justify-between items-center text-sm z-30'>
        <Link to="/" className="h-full w-auto flex justify-start items-center">
          <div className="group relative h-3/4 flex justify-center items-center">
            <img src={motogp} alt="logo" className="h-3/5" />
            <div className="h-full absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
          </div>
        </Link>
         <div className="float-right">
          <ul className="flex items-center justify-center gap-5">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="cursor-pointer text-white/70 hover:text-white font-extralight"
              >
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
            <li className="cursor-pointer text-white text-xs rounded-full px-4 py-2 uppercase font-semibold bg-red-600 hover:bg-red-700"
              onClick={() => window.location.href = "/championship"}
            >
              Crea campionato
            </li>
          </ul>
        </div>
    </div>
  );
}

export default Header;
