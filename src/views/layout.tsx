import type { Child } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  children: Child;
}

export function Layout({ title = 'Rota da Confra — SPS Group', children }: LayoutProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#101B54" />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        {children}
        <script src="/static/app.js" defer></script>
      </body>
    </html>
  );
}
