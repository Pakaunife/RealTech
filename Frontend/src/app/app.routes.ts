import { About } from './pagine/about/about';
import { Home } from './pagine/home/home';
import { Contact } from './pagine/contact/contact';
import { Policy} from './pagine/policy/policy';
import { Cookie } from './pagine/cookie/cookie';
import { SicurezzaPagamenti } from './pagine/sicurezza-pagamenti/sicurezza-pagamenti';
import { LavoraConNoi } from './pagine/lavora-con-noi/lavora-con-noi';
import { ChiSiamo } from './pagine/chi-siamo/chi-siamo';
import { Registrazione } from './pagine/registrazione/registrazione';
import { Film } from './film/film';

export const routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'policy', component: Policy },
  { path: 'cookie', component: Cookie },
  { path: 'sicurezza-pagamenti', component: SicurezzaPagamenti },
  { path: 'lavora-con-noi', component: LavoraConNoi },
  { path: 'chi-siamo', component: ChiSiamo },
  { path: 'registrazione', component: Registrazione },
  { path: 'film', component: Film }
];