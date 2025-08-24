import { About } from './pagine/about/about';
import { Home } from './pagine/home/home';
import { Contact } from './pagine/contact/contact';


export const routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact }
];