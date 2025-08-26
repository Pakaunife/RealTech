import { About } from './pagine/about/about';
import { Home } from './pagine/home/home';
import { Contact } from './pagine/contact/contact';
import { Policy} from './pagine/policy/policy';
import { Cookie } from './pagine/cookie/cookie';
import { SicurezzaPagamenti } from './pagine/sicurezza-pagamenti/sicurezza-pagamenti';
export const routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'policy', component: Policy },
  { path: 'cookie', component: Cookie },
  { path: 'sicurezza-pagamenti', component: SicurezzaPagamenti }
];