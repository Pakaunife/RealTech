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
import { Catalogo } from './pagine/catalogo/catalogo';
<<<<<<< HEAD
import { Login } from './pagine/login/login';
import { AuthGuard } from './services/auth.guard';
import { Profilo } from './pagine/profilo/profilo';
=======
import { Carrello } from './pagine/carrello/carrello';
>>>>>>> e884afa2a7eb6525b6c8dc3241b461412ab92231

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
  { path: 'film', component: Film },
  { path: 'catalogo', component: Catalogo },
<<<<<<< HEAD
  { path: 'login', component: Login },
  { path: 'profilo', component: Profilo, canActivate: [AuthGuard] }
=======
  { path: 'carrello', component: Carrello }
>>>>>>> e884afa2a7eb6525b6c8dc3241b461412ab92231
];