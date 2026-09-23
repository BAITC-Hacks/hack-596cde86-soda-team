import { Logo } from './Icons';

export function TopNav({ apiOk }: { apiOk: boolean }) {
  return (
    <header className="topnav">
      <a href="/" className="brand">
        <Logo />
        Аким на 5 часов
      </a>
      <nav aria-label="Основная навигация">
        <a href="/" aria-current="page">
          Симулятор
        </a>
        <a href="#best">Лучшие наборы</a>
        <a href="#districts">Районы</a>
        <a href="#method">Методика</a>
      </nav>
      <div className={`api-status${apiOk ? '' : ' is-down'}`}>
        <i />
        {apiOk ? 'API на связи' : 'API не отвечает'}
      </div>
    </header>
  );
}
