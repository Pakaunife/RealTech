import { About } from './pagine/about/about';
import { Home } from './pagine/home/home';


export const routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'about', component: About }
];