# RealTech - E-commerce Frontend

Progetto e-commerce sviluppato con Angular 20.2.0 che implementa un sistema di carrello personalizzato per ogni utente autenticato.

## �️ **Aggiornamenti 15 Ottobre 2025 - Fix Sfarfallio Suggerimenti Ricerca**

### 🔧 **Problemi Risolti**
- **Sfarfallio eliminato**: Stabilizzate dimensioni immagini e container suggerimenti
- **Performance ottimizzata**: Debounce aumentato a 400ms per ridurre chiamate API
- **Layout stabile**: Dimensioni fisse per prevenire layout shifts durante caricamento

### ⚡ **Miglioramenti Tecnici**
```css
.suggestion-image {
  width: 35px; height: 35px;
  flex-shrink: 0; /* Previene ridimensionamento */
  background-color: #252b34; /* Placeholder durante caricamento */
}
.suggestion-item {
  min-height: 55px; /* Altezza fissa per stabilità */
}
```

### 🎨 **UX Migliorata**
- **Caricamento fluido**: Loading lazy per immagini + placeholder colorato
- **Testo ottimizzato**: Ellipsis per nomi prodotti lunghi
- **CSS pulito**: Rimosso codice duplicato che causava conflitti

---

## 🔍 **Aggiornamenti 14 Ottobre 2025 - Sistema Ricerca Intelligente con Suggerimenti**

### 🎯 **Architettura Completa del Sistema di Ricerca**

#### 🔄 **Flusso di Funzionamento**
1. **Input utente** → Digitazione nella barra di ricerca
2. **Debouncing** → RxJS attende 400ms prima di elaborare
3. **API Call** → Richiesta al backend per suggerimenti
4. **Rendering** → Visualizzazione dropdown con risultati
5. **Navigazione** → Click porta alla pagina dettaglio prodotto

#### 🧩 **Componenti e Connessioni**

### 🖥️ **Frontend - Header Component**
**File**: `Frontend/src/app/header/header.ts`
```typescript
export class Header {
  searchSuggestions: any[] = [];
  showSuggestions: boolean = false;
  private searchSubject = new Subject<string>();
  
  constructor(private catalogoService: CatalogoService) {
    // 🔄 Setup RxJS pipeline per gestione ricerca
    this.searchSubject.pipe(
      debounceTime(400),           // ⏱️ Attende 400ms tra le digitazioni
      distinctUntilChanged(),      // 🔄 Evita chiamate duplicate
      switchMap((query: string) => {
        if (query.length >= 2) {
          return this.catalogoService.getSearchSuggestions(query);
        } else {
          return [];  // 🚫 Query troppo corta
        }
      })
    ).subscribe(suggestions => {
      // 📊 Aggiorna UI solo se query ancora valida
      if (this.searchQuery.length >= 2) {
        this.searchSuggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
      }
    });
  }

  // 🔤 Gestisce input utente in tempo reale
  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchSubject.next(query);  // 📡 Invia al pipeline RxJS
  }

  // 🎯 Gestisce click su suggerimento
  selectSuggestion(product: any) {
    this.searchQuery = '';
    this.showSuggestions = false;
    // 🧭 Naviga direttamente alla pagina prodotto
    this.router.navigate(['/catalogo'], { 
      queryParams: { prodottoId: product.id_prodotto } 
    });
  }
}
```

### 🔧 **Frontend - Servizio Catalogo**
**File**: `Frontend/src/app/services/catalogo.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:3000/api/catalogo';

  // 🔍 Metodo per ottenere suggerimenti di ricerca
  getSearchSuggestions(query: string, limit: number = 5): Observable<any[]> {
    if (!query || query.trim().length < 2) {
      return new Observable(observer => observer.next([]));
    }
    return this.http.get<any[]>(`${this.apiUrl}/search/suggestions`, {
      params: { q: query.trim(), limit: limit.toString() }
    });
  }
}
```

### 🏗️ **Backend - API Endpoint**
**File**: `Backend/routes/catalogo.js`
```javascript
// 🔍 Endpoint intelligente per suggerimenti ricerca
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    // ✅ Validazione input
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    
    // 🗄️ Query SQL con priorità intelligente
    const result = await pool.query(`
      SELECT 
        p.id_prodotto, p.nome, p.prezzo, p.immagine,
        m.nome AS marchio, c.nome AS categoria
      FROM prodotto p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN marchio m ON p.id_marchio = m.id_marchio
      WHERE (LOWER(p.nome) LIKE $1 OR LOWER(m.nome) LIKE $1 OR LOWER(c.nome) LIKE $1)
      AND p.quantita_disponibile > 0 AND p.bloccato = false
      ORDER BY 
        CASE 
          WHEN LOWER(p.nome) LIKE $2 THEN 1  -- 🥇 Priorità: nomi che iniziano con query
          WHEN LOWER(p.nome) LIKE $1 THEN 2  -- 🥈 Nomi che contengono query
          WHEN LOWER(m.nome) LIKE $1 THEN 3  -- 🥉 Marchi che contengono query
          ELSE 4
        END, p.nome
      LIMIT $3
    `, [searchTerm, `${q.trim().toLowerCase()}%`, limit]);
    
    // 🖼️ Costruzione URL immagini automatica
    const suggestions = result.rows.map(prodotto => ({
      ...prodotto,
      immagine_url: prodotto.immagine ? 
        `http://localhost:3000/api/images/prodotti/${prodotto.immagine}` : 
        'http://localhost:3000/api/images/prodotti/default.jpg'
    }));
    
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Errore DB' });
  }
});
```

### 🔄 **Ciclo di Vita Completo**
1. **Utente digita** → `onSearchInput()` cattura evento
2. **RxJS Pipeline** → Debounce + DistinctUntilChanged + SwitchMap
3. **Servizio Angular** → `catalogoService.getSearchSuggestions()`
4. **HTTP Request** → GET `/api/catalogo/search/suggestions?q=...`
5. **Database Query** → PostgreSQL con LIKE e priorità ORDER BY
6. **Response Processing** → Costruzione URL immagini + mapping
7. **UI Update** → Rendering dropdown con `*ngFor`
8. **User Click** → `selectSuggestion()` → Navigation con `queryParams`
9. **Catalogo Component** → Intercetta `prodottoId` → Mostra dettaglio

### 🛡️ **Gestione Errori e Edge Cases**
- **Query troppo corta**: Nessuna ricerca < 2 caratteri
- **Immagini mancanti**: Fallback automatico a default.jpg
- **API offline**: Observable vuoto previene crash
- **Click fuori dropdown**: HostListener chiude suggerimenti
- **Escape key**: Chiusura rapida dropdown

---

## �🔥 **Aggiornamenti 9 Ottobre 2025 - Top prodotti acquistati**

### 🏠 **Homepage - Top Acquisti**
- **Query Database**: L'API `/api/catalogo/popular` ora restituisce i prodotti più acquistati (top N), non i più visualizzati
- **Servizio Catalogo**: `CatalogoService.getProdottiPopular(limit)` continua a gestire l'endpoint
- **UI Dinamica**: Homepage mostra i primi 3 prodotti più acquistati (default)
- **Fallback**: Sistema di prodotti fittizi in caso di errore DB
- **CSS**: nessuna modifica richiesta rispetto alla visualizzazione precedente

### 🎯 **Navigazione Prodotti**
- **Click-to-Detail**: Prodotti homepage cliccabili per dettaglio
- **URL Parametrizzato**: Navigazione via `?prodottoId=X` per link diretti

### 🔧 **Backend - Query semplificata per prodotti più acquistati**
```sql
-- Top N prodotti più acquistati (somma delle quantità in `acquisti`)
SELECT p.*, c.nome AS categoria, m.nome AS marchio, a.total_purchased
FROM (
  SELECT id_prodotto, SUM(quantita) AS total_purchased
  FROM acquisti
  GROUP BY id_prodotto
  ORDER BY total_purchased DESC
  LIMIT 3
) a
JOIN prodotto p ON p.id_prodotto = a.id_prodotto
LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
LEFT JOIN marchio m ON p.id_marchio = m.id_marchio;
```

### 🖼️ **Sistema Immagini**
- **URL Dinamici**: `http://localhost:3000/api/images/prodotti/{immagine}`
- **Fallback Automatico**: Immagine default se prodotto senza foto

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
- **Carrello specifico per ogni utente** basato sull'ID estratto dal JWT token dell'utente loggato
- **Sicurezza**: Solo utenti autenticati possono gestire il carrello
- **Persistenza**: I prodotti rimangono salvati anche dopo logout/login
- **Sincronizzazione automatica**: Il carrello si aggiorna in tempo reale

## 🔧 Modifiche Tecniche Implementate

---

## 📝 Modifiche recenti (16 Ottobre 2025)

Questa sezione riepiloga le modifiche implementate di recente durante lo sviluppo della feature "pacchetti offerte" e alcune modifiche al comportamento del carrello e al layout della homepage.

Per ogni file indico il percorso e le funzioni/metodi principali toccati; usare questi riferimenti per navigare velocemente il codice.

### Backend (aggiunta route pacchetti)
- File: `Backend/routes/pacchetti.js`
  - GET `/api/pacchetti` -> ritorna lista pacchetti tematici con `immagine_url` e `numero_prodotti`.
  - GET `/api/pacchetti/:id` -> ritorna dettaglio del pacchetto e lista prodotti associati.

### Frontend: servizi e componenti
- File: `Frontend/src/app/services/pacchetti.service.ts`
  - getPacchetti(): Observable<Pacchetto[]> — chiama `GET /api/pacchetti`.
  - getPacchettoDettaglio(id): Observable<any> — chiama `GET /api/pacchetti/:id`.

- File: `Frontend/src/app/pagine/home/home.ts`
  - loadPacchetti(): carica i pacchetti e popola `this.pacchetti`.
  - vaiADettaglioPacchetto(pacchetto: Pacchetto): ora INVIA i prodotti del pacchetto al carrello chiamando `CarrelloService.aggiungiAlCarrello(...)` per ogni prodotto.
    - Nota: aggiunta lato UI del pulsante "Aggiungi al carrello" nella sezione OFFERTE SPECIALI (solo il pulsante esegue l'azione; clic sulla card non la attiva).

- File: `Frontend/src/app/services/carrello.service.ts`
  - getIdUtente(): legge l'utente dal `AuthService` e ritorna `id` oppure `null`.
  - aggiungiAlCarrello(idProdotto, quantita):
    - comportamento utenti autenticati: POST al backend `/api/carrello/aggiungi` e poi `caricaCarrello()`.
    - comportamento guest (semplice, in-memory): mantiene un array temporaneo in memoria e aggiorna `carrelloSubject` (non persistente).
  - rimuoviDalCarrello(idProdotto): supporta rimozione sia per utenti autenticati (backend) sia per guest (in-memory).
  - aggiornaQuantita(idProdotto, quantita): supporto sia backend (auth) sia in-memory (guest); se `quantita <= 0` rimuove l'item per guest.
  - ottieniCarrello(): Observable<any[]> — espone `carrello$` (BehaviorSubject) per la UI.
  - isLoggedIn(): helper che ritorna boolean (utile per bloccare il checkout se non loggati).

### Frontend: template e CSS
- File: `Frontend/src/app/pagine/home/home.html`
  - Sezione OFFERTE SPECIALI: le card `.package-card` non hanno più il `(click)` globale — solo il bottone "Aggiungi al carrello" lancia `vaiADettaglioPacchetto(pacchetto)`.

- File: `Frontend/src/app/pagine/home/home.css`
  - `.film-card`: ora ha background semi-trasparente (rgba) + `backdrop-filter: blur(4px)` per effetto glass.
  - `.news-container`: immagine di sfondo spostata in `::before` per permettere opacità controllata (es. `opacity: 0.45`).
  - `.offers-row`: gap ridotto (da 2rem → 0.8rem) e margin-bottom ridotto per avvicinare le card.
  - `.package-card` e `.films-row`: margini verticali ridotti per avvicinare le righe.

### Come testare velocemente
1. Avvia il backend (cartella `Backend`) e assicurati che ascolti su `http://localhost:3000`.
2. Avvia il frontend (`npm start` o `ng serve`) e apri `http://localhost:4200`.
3. Homepage:
   - Controlla la sezione "Prodotti più visualizzati" (prima riga): prodotti dovrebbero essere cliccabili per il dettaglio.
   - Nella sezione "Offerte speciali" clicca soltanto sul pulsante "Aggiungi al carrello" per aggiungere i prodotti del pacchetto al carrello.
4. Carrello:
   - Se sei loggato: le modifiche vengono salvate sul backend e ricaricate.
   - Se non sei loggato: puoi aggiungere/rimuovere/aggiornare in memoria (non persistente). Usa `CarrelloService.isLoggedIn()` per bloccare il checkout nel UI.
5. CSS:
   - Verifica l'effetto semi-trasparente sulle card (`.film-card`) e l'opacità dello sfondo in `.news-container`.

### Note e prossimi miglioramenti consigliati
- Migliorare il comportamento guest: persistenza (localStorage) o merge guest→user al login.
- Creare un endpoint backend per batch fetch prodotti per id (es. `/api/products?ids=1,2,3`) per arricchire il carrello guest in modo efficiente.
- Sostituire gli alert JS con snackbar/toast e disabilitare i bottoni durante le chiamate API.

Se vuoi, posso aprire una PR con queste modifiche o riportare lo stesso riepilogo anche nel `README.md` principale (root) del repository.


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

## 🐞 Bug Risolto: Catalogo non si resettava dopo visualizzazione prodotto popolare

### Problema
Quando si cliccava su un prodotto nei "PRODOTTI PIÙ VISUALIZZATI" dalla home, il parametro `prodottoId` rimaneva nell'URL. Se poi si cliccava su "Catalogo" nell'header, la pagina continuava a mostrare il dettaglio del prodotto invece della lista del catalogo.

### Soluzione Implementata
- **Componente Catalogo (`catalogo.ts`):**
  - Aggiunto metodo `resetStato()` che pulisce tutte le variabili di stato e riporta la vista alla lista delle categorie.
  - Modificato il costruttore: quando non ci sono parametri di query, viene chiamato `resetStato()` per assicurare che la pagina sia pulita.
  - Ora la navigazione diretta al catalogo mostra sempre la lista delle categorie/prodotti.
- **Header (`header.html` e `header.ts`):**
  - Modificato il link "Catalogo" nell'header per chiamare il metodo `pulisciParametriCatalogo()`.

---

## 🛒 Funzioni e Collegamenti Implementati per Acquisti/Checkout

### Backend
- **Route principale:** `Backend/routes/acquisti.js`
  - `/api/acquisti/checkout`  
    Riceve i dati di pagamento e processa l'acquisto (inserisce in tabella `acquisti`, aggiorna quantità prodotti, svuota carrello).
  - `/api/acquisti/storico/:id_utente`  
    Restituisce lo storico degli acquisti di un utente.
  - `/api/acquisti/dettaglio/:id_acquisto`  
    Restituisce i dettagli di un singolo acquisto.

- **Collegamento in `index.js`:**
  ```js
  const AcquistiRoutes = require('./routes/acquisti');
  app.use('/api/acquisti', AcquistiRoutes);
  ```

### Frontend

- **Servizio Acquisti:**  
  `src/app/services/acquisti.service.ts`
  - `processaCheckout(datiPagamento: DatiCheckout)`  
    Invia i dati di pagamento al backend e riceve conferma acquisto.
  - `getStoricoAcquisti()`  
    Ottiene la lista degli acquisti dell'utente.
  - `getDettaglioAcquisto(idAcquisto)`  
    Ottiene i dettagli di un singolo acquisto.

- **Pagina Checkout:**  
  `src/app/pagine/checkout/checkout.ts`  
  - Mostra riepilogo carrello, form pagamento, gestisce invio dati e navigazione.
  - Funzioni principali:
    - `processaAcquisto()`  
      Valida il form, invia i dati al servizio acquisti, aggiorna il carrello e reindirizza.
    - `tornaAlCarrello()`  
      Torna alla pagina carrello.
    - `formatNumeroCarla()`  
      Formatta il numero della carta.

- **Template Checkout:**  
  `src/app/pagine/checkout/checkout.html`  
  - Collega i dati del carrello e del form ai metodi del componente.

- **Collegamento dal Carrello:**  
  - Pulsante "Procedi al checkout" in `carrello.html` chiama `procediAlCheckout()` che naviga alla pagina `/checkout`.

- **Routing:**  
  `src/app/app.routes.ts`
  ```typescript
  { path: 'checkout', component: Checkout, canActivate: [AuthGuard] }
  ```

- **Semplificazione CSS:**  
  - Il file `checkout.css` ora usa selettori semplici e poche classi, facilitando la manutenzione.

---

## Modifiche Quantità Prodotti Disponibili

### Descrizione
Quando un utente effettua un acquisto, la quantità dei prodotti disponibili viene aggiornata nel backend per riflettere l'acquisto effettuato.

### Dettagli Implementativi
- **Modifica quantità prodotti disponibili:**
    - La quantità disponibile viene aggiornata direttamente nel backend, all'interno della route `/api/acquisti/checkout` nel file `Backend/routes/acquisti.js`.
    - Per ogni prodotto acquistato, viene eseguita la query:
      ```js
      await client.query(`
        UPDATE prodotto 
        SET quantita_disponibile = quantita_disponibile - $1 
        WHERE id_prodotto = $2
      `, [item.quantita, item.id_prodotto]);
      ```
    - Questo garantisce che la quantità dei prodotti sia sempre aggiornata dopo ogni acquisto.
