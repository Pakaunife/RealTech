# RealTech - E-commerce Frontend

Progetto e-commerce sviluppato con Angular 20.2.0 che implementa un sistema di carrello personalizzato per ogni utente autenticato.

## 🔥 **Aggiornamenti 9 Ottobre 2025 - Sistema Prodotti Più Visualizzati**

### 🏠 **Homepage - Prodotti Trending**
- **Query Database**: Nuova API `/api/catalogo/popular` per prodotti più visualizzati
- **Servizio Catalogo**: Creato `CatalogoService` per gestire endpoint catalogo
- **UI Dinamica**: Homepage mostra i primi 3 prodotti più visti dal database
- **Fallback**: Sistema di prodotti fittizi in caso di errore DB
- **CSS Ottimizzato**: Immagini ridimensionate (220px altezza) con `object-fit: contain`

### 🎯 **Navigazione Prodotti**
- **Click-to-Detail**: Prodotti homepage cliccabili per dettaglio
- **URL Parametrizzato**: Navigazione via `?prodottoId=X` per link diretti
- **UX Intelligente**: 
  - Da home → Dettaglio pulito (no pulsante "Torna ai Prodotti")
  - Da catalogo → Dettaglio completo (con navigazione standard)

### 🔧 **Backend API Enhancement**
```sql
-- Nuova query prodotti più visualizzati
SELECT p.*, c.nome AS categoria, m.nome AS marchio, 
       COUNT(v.id) as total_views
FROM prodotto p
LEFT JOIN visualizzazioni v ON p.id_prodotto = v.prodotto_id
GROUP BY p.id_prodotto
ORDER BY total_views DESC NULLS LAST
LIMIT 3
```

### 🖼️ **Sistema Immagini Migliorato**
- **URL Dinamici**: `http://localhost:3000/api/images/prodotti/{immagine}`
- **Fallback Automatico**: Immagine default se prodotto senza foto
- **Costruzione Automatica**: URL immagini generati server-side

### 🎨 **UX Dettaglio Prodotto**
- **Modalità Pulita**: Da home nasconde elementi ridondanti
- **Informazioni Smart**: Disponibilità e titolo secondario nascosti quando appropriato
- **Marchio Corretto**: Risolto problema "Non specificato" usando endpoint catalogo

---

## 💻 **Implementazione Tecnica Dettagliata**

### 🛠️ **1. Backend - Nuova API `/api/catalogo/popular`**

**File**: `Backend/routes/catalogo.js`
```javascript
router.get('/popular', async (req, res) => {
  const { limit = 3 } = req.query; 
  
  const result = await pool.query(`
    SELECT 
      p.id_prodotto, p.nome, p.prezzo, p.descrizione, p.immagine,
      p.quantita_disponibile, m.nome AS marchio, c.nome AS categoria,
      COALESCE(v.total_views, 0) as total_views
    FROM prodotto p
    LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
    LEFT JOIN (
      SELECT prodotto_id, COUNT(*) as total_views
      FROM visualizzazioni 
      GROUP BY prodotto_id
    ) v ON p.id_prodotto = v.prodotto_id
    WHERE p.quantita_disponibile > 0 AND p.bloccato = false
    ORDER BY total_views DESC NULLS LAST, p.nome
    LIMIT $1
  `, [limit]);
  
  // Costruisce URL immagini automaticamente
  const prodotti = result.rows.map(prodotto => ({
    ...prodotto,
    immagine_url: prodotto.immagine ? 
      `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 
      'http://localhost:3000/api/images/prodotti/default.jpg'
  }));
  
  res.json(prodotti);
});
```

### 🎯 **2. Frontend - Servizio Catalogo**

**File**: `Frontend/src/app/services/catalogo.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:3000/api/catalogo';

  constructor(private http: HttpClient) {}

  // Ottieni prodotti più visualizzati (per la home)
  getProdottiPopular(limit: number = 6): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/popular?limit=${limit}`);
  }

  // Altri metodi catalogo...
  getCategorie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prodotti`);
  }
}
```

### 🏠 **3. Homepage - Integrazione Dinamica**

**File**: `Frontend/src/app/pagine/home/home.ts`
```typescript
export class Home implements OnInit {
  prodottiInEvidenza: any[] = [];
  loading = true;
  error = '';

  constructor(
    public auth: AuthService,
    private catalogoService: CatalogoService
  ) {}
  
  ngOnInit() {
    this.loadProdottiPopular();
  }

  loadProdottiPopular() {
    this.loading = true;
    this.catalogoService.getProdottiPopular(3).subscribe({
      next: (prodotti) => {
        this.prodottiInEvidenza = prodotti;
        this.loading = false;
      },
      error: (err) => {
        // Fallback a dati fittizi
        this.prodottiInEvidenza = [...prodottiFallback];
        this.loading = false;
      }
    });
  }
}
```

**File**: `Frontend/src/app/pagine/home/home.html`
```html
<div class="films-row" *ngIf="!loading && !error">
  <div class="film-card" *ngFor="let prodotto of prodottiInEvidenza | slice:0:3">
    <div class="film-info">
      <img [src]="prodotto.immagine_url" [alt]="prodotto.nome" class="prodotto-img" />
      <h2>{{ prodotto.nome }}</h2>
      <p>{{ prodotto.categoria || 'Categoria' }}</p>
    </div>
  </div>
</div>
```

### 🎯 **4. Navigazione Intelligente al Dettaglio**

**File**: `Frontend/src/app/pagine/catalogo/catalogo.ts`
```typescript
export class Catalogo {
  arrivoDaHome: boolean = false;
  
  constructor(private route: ActivatedRoute, ...) {
    this.route.queryParams.subscribe(params => {
      if (params['prodottoId']) {
        this.arrivoDaHome = true; // Flag per UX differenziata
        this.caricaProdottoDettaglio(params['prodottoId']);
      } else {
        this.arrivoDaHome = false;
        this.caricaCategorie();
      }
    });
  }

  caricaProdottoDettaglio(id: number) {
    // Usa endpoint catalogo per dati completi (marchio incluso)
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/popular?limit=1000`)
      .subscribe(prodotti => {
        const prodotto = prodotti.find(p => p.id_prodotto == id);
        if (prodotto) {
          this.prodottoSelezionato = prodotto;
          this.mostraDettaglio = true;
        }
      });
  }
}

```
## 🎨 **Aggiornamenti UI/UX - 8 Ottobre 2025**

### ✨ **Ottimizzazioni CSS e Layout**
- **Footer Sticky**: Risolto problema footer non in fondo alla pagina
- **Consolidamento CSS**: Unificate classi duplicate in `.carrello-text` e `.carrello-label`
- **Carrello Design**: Migliorato layout, centratura e visibilità testi
- **Immagini Prodotti**: Ingrandite nel carrello (140px → 180px)
- **Pulsanti Uniformi**: Gradiente arancione coerente su tutti i CTA

### 🖼️ **Sistema Immagini Categorie Dinamiche**
- **Backend**: Query categorie include campo `immagine` + URL dinamici
- **Frontend**: CSS dinamico per background-image tramite Angular binding
- **Infrastruttura**: Cartella `/Backend/uploads/categorie/` per immagini personalizzate
- **Fallback**: Sistema di immagini di default per categorie senza immagine

### 🎯 **Miglioramenti Catalogo**
- **Layout Prodotti**: Grid 2 colonne per migliore visualizzazione
- **Sfondo Trasparente**: Blocchi prodotti con `rgba(0,0,0,0.3)`
- **Filtri Avanzati**: Styling migliorato per selezione marche
- **Hover Effects**: Animazioni fluide e ombre dinamiche

---

## 🚀 Funzionalità Implementate

### 🔐 Sistema di Autenticazione
- Login utenti con JWT Token
- Autenticazione sicura tramite token firmato dal backend
- Gestione automatica della sessione utente

### 🛒 Carrello Personalizzato per Utente
- **Carrello specifico per ogni utente** basato sull'ID estratto dal JWT token
- **Sicurezza**: Solo utenti autenticati possono gestire il carrello
- **Persistenza**: I prodotti rimangono salvati anche dopo logout/login
- **Sincronizzazione automatica**: Il carrello si aggiorna in tempo reale

## 🔧 Modifiche Tecniche Implementate

### 🛒 CarrelloService (`carrello.service.ts`)

#### **Cambiamento Principale:**
- ❌ **PRIMA**: `private idUtente = 1;` (ID fisso per tutti gli utenti)
- ✅ **DOPO**: ID dinamico estratto dal JWT token dell'utente loggato

#### **Modifiche Dettagliate:**

**1. Dependency Injection AuthService:**
```typescript
// AGGIUNTO:
import { AuthService } from './auth.service';
constructor(private http: HttpClient, private authService: AuthService)
```

**2. Metodo di Estrazione ID Utente:**
```typescript
// AGGIUNTO:
private getIdUtente(): number | null {
  const user = this.authService.getUser();  // Decodifica JWT token
  return user ? user.id : null;             // Estrae ID o null
}
```

**3. Controlli di Sicurezza in tutti i metodi:**
```typescript
// AGGIUNTO a aggiungiAlCarrello(), rimuoviDalCarrello(), aggiornaQuantita():
const idUtente = this.getIdUtente();
if (!idUtente) {
  throw new Error('Utente non autenticato. Effettua il login...');
}
```

**4. Gestione Carrello Vuoto per Non Autenticati:**
```typescript
// MODIFICATO caricaCarrello():
if (!idUtente) {
  this.carrelloSubject.next([]);  // Svuota carrello se non loggato
  return;
}
```

**5. Nuovi Metodi di Utilità:**
```typescript
// AGGIUNTI:
ricaricaCarrello(): void {
  this.caricaCarrello();  // Ricarica dopo login
}

svuotaCarrello(): void {
  this.carrelloSubject.next([]);  // Svuota al logout
}
```

#### **Impatto delle Modifiche:**
- 🔒 **Sicurezza**: Ogni operazione verifica l'autenticazione
- 🎯 **Personalizzazione**: Ogni utente vede solo i suoi prodotti
- 🔄 **Sincronizzazione**: Carrello aggiornato automaticamente
- ⚡ **Performance**: Caricamento solo quando necessario

### 🔐 AuthService (`auth.service.ts`)

#### **Miglioramenti Implementati:**

**1. Gestione Errori Token:**
```typescript
// MODIFICATO getUser():
try {
  return jwtDecode(token);
} catch (error) {
  localStorage.removeItem('token');  // Rimuove token corrotto
  return null;
}
```

**2. Metodo di Utilità:**
```typescript
// AGGIUNTO:
getUserId(): number | null {
  const user = this.getUser();
  return user ? user.id : null;
}
```

#### **Benefici:**
- 🛡️ **Robustezza**: Gestisce token corrotti automaticamente
- 🔧 **Utilità**: Accesso diretto all'ID utente
- 🚿 **Pulizia**: Rimozione automatica dati invalidi

### 🚪 Login Component (`login.ts`)

#### **Integrazione Carrello:**

**1. Importazione CarrelloService:**
```typescript
// AGGIUNTO:
import { CarrelloService } from '../../services/carrello.service';
```

**2. Dependency Injection:**
```typescript
// MODIFICATO constructor:
constructor(
  private fb: FormBuilder, 
  private http: HttpClient, 
  private router: Router,
  private carrelloService: CarrelloService  // AGGIUNTO
)
```

**3. Ricaricamento Carrello Post-Login:**
```typescript
// AGGIUNTO nel onSubmit():
next: (res: any) => {
  localStorage.setItem('token', res.token);
  this.carrelloService.ricaricaCarrello();  // NUOVO
  this.router.navigate(['/home']);
}
```

#### **Risultato:**
- 🔄 **Sincronizzazione Immediata**: Carrello aggiornato appena loggato
- 🎯 **UX Fluida**: Nessuna ricarica pagina necessaria
- ⚡ **Reattività**: Transizione istantanea stati utente
- Sincronizzazione stato utente-carrello

## 🔄 Flusso di Funzionamento

1. **Utente non loggato**: 
   - Carrello vuoto
   - Impossibile aggiungere prodotti (errore di autenticazione)

2. **Login utente**:
   - Token JWT salvato in localStorage
   - Carrello ricaricato automaticamente con prodotti dell'utente
   - ID utente estratto dal token per tutte le operazioni

3. **Operazioni carrello**:
   - Ogni richiesta usa l'ID utente dal token
   - Backend riceve l'ID corretto per associare prodotti all'utente giusto
   - Sincronizzazione automatica dopo ogni modifica

4. **Logout**:
   - Token rimosso
   - Carrello svuotato per sicurezza

## 🛡️ Sicurezza

- **JWT Token**: Firmato dal backend con chiave segreta
- **Impossibile falsificare**: Modifiche al token lo rendono invalido
- **Controlli lato client**: Verifica autenticazione prima di ogni operazione
- **Validazione backend**: Ogni richiesta viene validata dal server

## 🎯 Risultato

- **Multi-utente**: Ogni utente ha il proprio carrello privato
- **Sicuro**: Solo utenti autenticati possono gestire il carrello  
- **Persistente**: I dati rimangono salvati tra le sessioni
- **User Experience**: Transizioni fluide tra stati autenticato/non autenticato

---

## 💻 Development Server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

---

## 🖼️ Gestione Immagini Prodotti (Ultimo Aggiornamento)

### 🔄 Migrazione da Frontend a Backend

È stata implementata una nuova architettura per la gestione delle immagini dei prodotti, spostandole dal frontend al backend per una gestione centralizzata e più efficiente.

#### **Cambiamenti Architetturali:**

### 🗂️ Backend (`Backend/`)

**1. Struttura File Aggiunta:**
```
Backend/
├── uploads/
│   └── prodotti/
│       ├── default.jpg
│       ├── rtx4090.jpg
│       └── [altre immagini prodotti]
```

**2. Server Express (`index.js`):**
```javascript
// AGGIUNTO: Middleware per servire file statici
const path = require('path');
app.use('/api/images', express.static(path.join(__dirname, 'uploads')));
```

**3. API Catalogo (`routes/catalogo.js`):**
```javascript
// MODIFICATO: Aggiunta URL completo immagine nel response
const prodottiConUrl = result.rows.map(prodotto => ({
  ...prodotto,
  immagine_url: prodotto.immagine 
    ? `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` 
    : 'http://localhost:3000/api/images/prodotti/default.jpg'
}));
```

**4. API Carrello (`routes/carrello.js`):**
```javascript
// MODIFICATO: URL immagini anche per prodotti nel carrello
const carrelloConUrl = rows.map(item => ({
  ...item,
  immagine_url: item.immagine 
    ? `http://localhost:3000/api/images/prodotti/${item.immagine}` 
    : 'http://localhost:3000/api/images/prodotti/default.jpg'
}));
```

### 🎨 Frontend (`Frontend/`)

**1. Template Catalogo (`catalogo.html`):**
```html
<!-- PRIMA: -->
<img [src]="'assets/prodotti/' + (prodotto.immagine)" [alt]="prodotto.nome">

<!-- DOPO: -->
<img [src]="prodotto.immagine_url || 'http://localhost:3000/api/images/prodotti/default.jpg'" 
     [alt]="prodotto.nome">
```

**2. Template Carrello (`carrello.html`):**
```html
<!-- PRIMA: -->
<img [src]="'assets/prodotti/' + item.immagine" [alt]="item.nome">

<!-- DOPO: -->
<img [src]="item.immagine_url || 'http://localhost:3000/api/images/prodotti/default.jpg'" 
     [alt]="item.nome">
```

#### **Vantaggi dell'Implementazione:**

- 🎯 **Centralizzazione**: Tutte le immagini gestite dal backend
- 📦 **Build Ottimizzato**: Frontend più leggero (no immagini in assets)
- 🔄 **Gestione Dinamica**: Possibilità di aggiungere/modificare immagini senza rebuild
- 🛡️ **Controllo Accessi**: Possibilità futura di implementare autenticazione per immagini
- 🌐 **Scalabilità**: Facile integrazione con CDN o storage cloud
- 🔧 **Manutenzione**: Aggiornamenti immagini senza rideploy frontend

#### **Endpoint Immagini:**
- **URL Base**: `http://localhost:3000/api/images/prodotti/`
- **Esempio**: `http://localhost:3000/api/images/prodotti/rtx4090.jpg`
- **Fallback**: `default.jpg` per immagini mancanti

#### **Compatibilità:**
- ✅ **Retrocompatibilità**: Gestione automatica immagini mancanti
- ✅ **Fallback Graceful**: Immagine default se file non trovato
- ✅ **API Consistente**: Stesso formato response per tutti gli endpoint

---

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
