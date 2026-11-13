import { RouterProvider } from '@tanstack/react-router';
import { renderPage } from '../../renderPage';
import { router } from '../../router';

renderPage(<RouterProvider router={router} />);
