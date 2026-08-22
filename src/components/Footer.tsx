import { formatDate } from '../lib/format';

interface Props {
  updatedAt: string;
}

export function Footer({ updatedAt }: Props) {
  return (
    <footer className="footer">
      <p className="footer__philosophy">Boring, disciplined, repeated weeks.</p>
      <div className="footer__meta mono">
        <span>Updated {formatDate(updatedAt)}</span>
        <span className="footer__dot" aria-hidden="true">
          ·
        </span>
        <a href="https://www.strava.com/" target="_blank" rel="noopener noreferrer">
          Strava
        </a>
      </div>
    </footer>
  );
}
