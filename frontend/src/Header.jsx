import './App.css'

function Header() {
  return (
    <div className='sticky h-15 top-0 left-0 w-full px-2 shadow-md bg-white flex justify-between items-center'>
        <img src="./logo_moto_gp.png" alt="logo" className='h-full' />
        <div className='float-right'>
            <ul className='flex gap-4'>
                <li className='cursor-pointer hover:text-red-500'>Calendario</li>
                <li className='cursor-pointer hover:text-red-500'>Risultati</li>
                <li className='cursor-pointer hover:text-red-500'>Piloti</li>
                <li className='cursor-pointer hover:text-red-500'>Team</li>
            </ul>
        </div>
    </div>
  );
}

export default Header;
