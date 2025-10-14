import { About } from './pagine/about/about';
import { Home } from './pagine/home/home';
import { Contact } from './pagine/contact/contact';
import { Policy} from './pagine/policy/policy';
import { Cookie } from './pagine/cookie/cookie';
import { SicurezzaPagamenti } from './pagine/sicurezza-pagamenti/sicurezza-pagamenti';
import { LavoraConNoi } from './pagine/lavora-con-noi/lavora-con-noi';
import { ChiSiamo } from './pagine/chi-siamo/chi-siamo';
import { Registrazione } from './pagine/registrazione/registrazione';
import { Catalogo } from './pagine/catalogo/catalogo';
import { Login } from './pagine/login/login';
import { AuthGuard } from './services/auth.guard';
import { Profilo } from './pagine/profilo/profilo';
import { Carrello } from './pagine/carrello/carrello';
import { Checkout } from './pagine/checkout/checkout';
import { Admin } from './admin/admin';
import { StoricoAcquisti } from './pagine/storico-acquisti/storico-acquisti';
import { Novita } from './pagine/novita/novita';
import { Ordini } from './pagine/ordini/ordini';
import { DettagliOrdine } from './pagine/dettagli-ordine/dettagli-ordine';


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
  { path: 'catalogo', component: Catalogo },
  { path: 'login', component: Login },
  { path: 'profilo', component: Profilo, canActivate: [AuthGuard] },
  { path: 'admin', component: Admin, canActivate: [AuthGuard], data: { admin: true } },
  { path: 'carrello', component: Carrello },
  { path: 'checkout', component: Checkout, canActivate: [AuthGuard] },
  { path: 'storico-acquisti', component: StoricoAcquisti, canActivate: [AuthGuard] },
  { path: 'novita/:articolo', component: Novita },
  { path: 'ordini', component: Ordini, canActivate: [AuthGuard] },
  { path: 'dettagli-ordine/:id', component: DettagliOrdine, canActivate: [AuthGuard] },
];