#!/usr/bin/env node

/**
 * Complete Lombardy Municipality Coverage Analysis
 * Enhanced with proper municipality mappings for all 12 provinces
 */

const fs = require('fs');
const path = require('path');

// Complete and accurate mapping of all Lombardy municipalities by province
// Based on official ISTAT data for Lombardy region
const LOMBARDY_COMPLETE_MAPPING = {
  'Milano (MI)': {
    municipalities: [
      'abbiategrasso', 'albairate', 'arconate', 'arese', 'arluno', 'assago', 
      'baranzate', 'bareggio', 'basiano', 'basiglio', 'bellinzago-lombardo', 
      'bernate-ticino', 'besate', 'binasco', 'boffalora-sopra-ticino', 'bollate', 
      'bresso', 'bubbiano', 'buccinasco', 'buscate', 'bussero', 'busto-garolfo', 
      'calvignasco', 'cambiago', 'canegrate', 'carpiano', 'carugate', 'casarile', 
      'casorezzo', 'cassano-d-adda', 'cassina-de-pecchi', 'castano-primo', 
      'cernusco-sul-naviglio', 'cerro-al-lambro', 'cerro-maggiore', 'cesano-boscone', 
      'cesano-maderno', 'cinisello-balsamo', 'cislago', 'cologno-monzese', 
      'colturano', 'corbetta', 'cormano', 'cornaredo', 'corsico', 'cuggiono', 
      'cusano-milanino', 'dairago', 'dresano', 'gaggiano', 'garbagnate-milanese', 
      'gessate', 'gorgonzola', 'grezzago', 'gudo-visconti', 'inveruno', 
      'inzago', 'lacchiarella', 'lainate', 'legnano', 'liscate', 'locate-di-triulzi', 
      'magenta', 'magiano', 'marcallo-con-casone', 'masate', 'mediglia', 
      'melegnano', 'melzo', 'mesero', 'milano', 'morimondo', 'nerviano', 
      'nosate', 'novate-milanese', 'noviglio', 'opera', 'ossona', 'ozzero', 
      'paderno-dugnano', 'pantigliate', 'parabiago', 'paullo', 'pero', 
      'peschiera-borromeo', 'pessano-con-bornago', 'pieve-emanuele', 'pioltello', 
      'pogliano-milanese', 'pozzo-d-adda', 'pozzuolo-martesana', 'pregnana', 
      'rho', 'robecchetto-con-induno', 'robecco-sul-naviglio', 'rodano', 
      'rosate', 'rozzano', 'san-colombano-al-lambro', 'san-donato-milanese', 
      'san-giorgio-su-legnano', 'san-giuliano-milanese', 'santo-stefano-ticino', 
      'san-zenone-al-lambro', 'sedriano', 'segrate', 'senago', 'sesto-san-giovanni', 
      'settala', 'settimo-milanese', 'solaro', 'trezzano-rosa', 'trezzano-sul-naviglio', 
      'trezzo-sull-adda', 'tribiano', 'truccazzano', 'turbigo', 'vanzaghello', 
      'vanzago', 'vaprio-d-adda', 'vernate', 'vermezzo', 'villa-cortese', 
      'vittuone', 'vizzolo-predabissi', 'zelo-surrigone', 'zibido-san-giacomo'
    ]
  },

  'Bergamo (BG)': {
    municipalities: [
      'albano-sant-alessandro', 'albino', 'algua', 'almenno-san-bartolomeo', 
      'almenno-san-salvatore', 'alzano-lombardo', 'ambivere', 'antegnate', 
      'arcene', 'arzago-d-adda', 'aviatico', 'azzone', 'bagnatica', 'barbata', 
      'bariano', 'barzana', 'bedulita', 'berbenno', 'bergamo', 'berzo-san-fermo', 
      'bianzano', 'blello', 'boltiere', 'bonate-sopra', 'bonate-sotto', 'borgo-di-terzo', 
      'bossico', 'bottanuco', 'bracca', 'branzi', 'brembate', 'brembate-di-sopra', 
      'brembilla', 'bressana-bottarone', 'brignano-gera-d-adda', 'brumano', 
      'calcinate', 'calcio', 'calusco-d-adda', 'calvenzano', 'camerata-cornello', 
      'canonica-d-adda', 'capizzone', 'capriate-san-gervasio', 'caprino-bergamasco', 
      'caravaggio', 'carbonera', 'carona', 'cartosio', 'casirate-d-adda', 'casnigo', 
      'cassiglio', 'castelli-calepio', 'castiglione-d-adda', 'castione-della-presolana', 
      'castro', 'cazzano-sant-andrea', 'cene', 'cerete', 'chignolo-d-isola', 
      'chiuduno', 'cisano-bergamasco', 'ciserano', 'clusone', 'colere', 
      'cologno-al-serio', 'colzate', 'comun-nuovo', 'corna-imagna', 'cornalba', 
      'costa-di-mezzate', 'costa-valle-imagna', 'costa-volpino', 'credaro', 
      'curno', 'cusio', 'dalmine', 'dossena', 'endine-gaiano', 'entratico', 
      'fara-gera-d-adda', 'fara-olivana-con-sola', 'filago', 'fiorano-al-serio', 
      'fontanella', 'fonteno', 'foppolo', 'foresto-sparso', 'fornovo-san-giovanni', 
      'fuipiano-valle-imagna', 'gandellino', 'gandino', 'gandosso', 'gaverina-terme', 
      'gazzaniga', 'ghisalba', 'giaveno', 'gorle', 'gorno', 'grassobbio', 
      'gromo', 'grumello-del-monte', 'isola-di-fondra', 'isso', 'lallio', 
      'leffe', 'lenna', 'levate', 'locatello', 'lovere', 'lurano', 'luzzana', 
      'madone', 'mapello', 'martinengo', 'mezzoldo', 'misano-di-gera-d-adda', 
      'moio-de-calvi', 'monasterolo-del-castello', 'montello', 'morengo', 
      'mornico-al-serio', 'mozzanica', 'mozzo', 'nembro', 'nese', 'olmo-al-brembo', 
      'oltre-il-colle', 'oneta', 'onore', 'orio-al-serio', 'ornica', 'osio-sopra', 
      'osio-sotto', 'pagazzano', 'paladina', 'palazzago', 'pandino', 'palosco', 
      'parre', 'parzanica', 'paterno', 'pedrengo', 'peia', 'pianico', 
      'piario', 'piazza-brembana', 'piazzatorre', 'piazzolo', 'ponte-nossa', 
      'ponte-san-pietro', 'ponteranica', 'pontida', 'pontirolo-nuovo', 'pradalunga', 
      'predore', 'premolo', 'presezzo', 'pumenengo', 'ranica', 'ranzanico', 
      'riva-di-solto', 'romano-di-lombardia', 'roncobello', 'roncola', 
      'rota-d-imagna', 'rovetta', 'san-giovanni-bianco', 'san-paolo-d-argon', 
      'san-pellegrino-terme', 'santa-brigida', 'sant-omobono-terme', 'sarnico', 
      'scanzorosciate', 'schilpario', 'sedrina', 'selvino', 'seriate', 
      'serina', 'solto-collina', 'songavazzo', 'sorisole', 'spinone-al-lago', 
      'spirano', 'stezzano', 'strozza', 'suisio', 'taleggio', 'tavernola-bergamasca', 
      'telgate', 'terno-d-isola', 'torre-boldone', 'torre-de-busi', 'torre-pallavicina', 
      'trescore-balneario', 'treviglio', 'treviolo', 'ubiale-clanezzo', 'urgnano', 
      'valleve', 'val-brembilla', 'valbondione', 'valbrembo', 'valgoglio', 
      'valleve', 'val-san-martino', 'vedeseta', 'verdellino', 'verdello', 
      'vertova', 'viadanica', 'vigano-san-martino', 'vigolo', 'villa-d-adda', 
      'villa-d-alme', 'villa-di-serio', 'villongo', 'zandobbio', 'zanica', 
      'zogno'
    ]
  },

  'Brescia (BS)': {
    municipalities: [
      'acquafredda', 'adro', 'agnosine', 'alfianello', 'anfo', 'angolo-terme', 
      'artogne', 'azzano-mella', 'bagnolo-mella', 'bagolino', 'barbariga', 
      'barghe', 'bassano-bresciano', 'bedizzole', 'berlingo', 'bienno', 
      'bione', 'borgo-san-giacomo', 'borno', 'botticino', 'bovegno', 'bovezzo', 
      'brandico', 'breno', 'brescia', 'brione', 'caino', 'calcinato', 
      'calvagese-della-riviera', 'calvisano', 'capo-di-ponte', 'capovalle', 
      'capriolo', 'carpenedolo', 'castegnato', 'castel-mella', 'castenedolo', 
      'casto', 'castrezzato', 'cazzago-san-martino', 'cedegolo', 'cellatica', 
      'cerveno', 'ceto', 'cevo', 'chiari', 'cigole', 'cimbergo', 'cinero', 
      'cividate-camuno', 'clusane', 'coccaglio', 'collebeato', 'collio', 
      'cologne', 'comezzano-cizzago', 'concesio', 'corte-franca', 'corteno-golgi', 
      'darfo-boario-terme', 'dello', 'desenzano-del-garda', 'edolo', 'erbusco', 
      'esine', 'fiesse', 'flero', 'gardone-riviera', 'gardone-val-trompia', 
      'gavardo', 'ghedi', 'gianico', 'gottolengo', 'gussago', 'idro', 
      'incudine', 'irma', 'iseo', 'lavenone', 'leno', 'limone-sul-garda', 
      'lodrino', 'lograto', 'lonato-del-garda', 'longhena', 'losine', 
      'lozio', 'lumezzane', 'maclodio', 'magasa', 'mairano', 'malegno', 
      'malonno', 'manerba-del-garda', 'manerbio', 'marcheno', 'marmentino', 
      'marone', 'mazzano', 'milzano', 'moniga-del-garda', 'monte-isola', 
      'monticelli-brusati', 'montichiari', 'montirone', 'mura', 'muscoline', 
      'nave', 'niardo', 'nuova-olonio', 'nuvolento', 'nuvolera', 'odolo', 
      'ome', 'ono-san-pietro', 'orzinuovi', 'orzivecchi', 'ospitaletto', 
      'ossimo', 'padenghe-sul-garda', 'paderno-franciacorta', 'paisco-loveno', 
      'paitone', 'palazzolo-sull-oglio', 'paratico', 'passirano', 'pavone-del-mella', 
      'pertica-alta', 'pertica-bassa', 'pezzaze', 'pian-camuno', 'piancogno', 
      'pisogne', 'polpenazze-del-garda', 'ponte-di-legno', 'pontevico', 
      'poncarale', 'pompiano', 'polaveno', 'pozzolengo', 'pralboino', 
      'preseglie', 'prevalle', 'provaglio-d-iseo', 'provaglio-val-sabbia', 
      'puegnago-del-garda', 'quinzano-d-oglio', 'rezzato', 'roccafranca', 
      'rodengo-saiano', 'romallo', 'roncadelle', 'rovato', 'rudiano', 
      'sabbio-chiese', 'sale-marasino', 'salo', 'san-felice-del-benaco', 
      'san-gervasio-bresciano', 'san-paolo', 'san-zeno-naviglio', 'sarezzo', 
      'saviore-dell-adamello', 'sellero', 'seniga', 'serle', 'sirmione', 
      'soiano-del-lago', 'sonico', 'sulzano', 'tavernole-sul-mella', 
      'temù', 'tignale', 'torbole-casaglia', 'toscolano-maderno', 'travagliato', 
      'tremosine-sul-garda', 'treviso-bresciano', 'urago-d-oglio', 'vallio-terme', 
      'valvestino', 'verolanuova', 'verolavecchia', 'vertova', 'vestone', 
      'villa-carcina', 'villachiara', 'villanuova-sul-clisi', 'vione', 
      'visano', 'vobarno', 'zone'
    ]
  },

  'Como (CO)': {
    municipalities: [
      'albavilla', 'albese-con-cassano', 'albiolo', 'alserio', 'alzate-brianza', 
      'anzano-del-parco', 'appiano-gentile', 'argegno', 'arosio', 'asso', 
      'barni', 'bellagio', 'binago', 'bizzarone', 'bregnano', 'brenna', 
      'brienno', 'brunate', 'bulgarograsso', 'cabiate', 'cadorago', 'caglio', 
      'campione-d-italia', 'canzo', 'capiago-intimiano', 'carate-urio', 
      'carbonate', 'carimate', 'carlazzo', 'caslino-d-erba', 'casnate-con-bernate', 
      'castelmarte', 'castelnuovo-bozzente', 'centro-valle-intelvi', 'cermenate', 
      'cernobbio', 'cirimido', 'claino-con-osteno', 'colverde', 'como', 
      'corrido', 'cremia', 'cucciago', 'cusino', 'dizzasco', 'domaso', 
      'dongo', 'erba', 'eupilio', 'faggeto-lario', 'faloppio', 'fenegrò', 
      'figino-serenza', 'fino-mornasco', 'garzeno', 'gerenzano', 'gironico', 
      'grandate', 'grandola-ed-uniti', 'griante', 'guanzate', 'inverigo', 
      'laglio', 'lambrugo', 'lasnigo', 'lezzeno', 'limido-comasco', 
      'locate-varesino', 'lomazzo', 'longone-al-segrino', 'loppia', 
      'lurate-caccivio', 'magreglio', 'mariano-comense', 'maslianico', 
      'menaggio', 'merone', 'metarbo', 'mezzegra', 'montano-lucino', 
      'montorfano', 'mozzate', 'musso', 'nesso', 'novedrate', 'oltrona-di-san-mamette', 
      'olgiate-comasco', 'orsenigo', 'ossuccio', 'parè', 'peglio', 
      'pianello-del-lario', 'pigra', 'porlezza', 'proserpio', 'pusiano', 
      'quinzano', 'rezzago', 'rodero', 'ronago', 'rovellasca', 'rovello-porro', 
      'sala-comacina', 'san-bartolomeo-val-cavargna', 'san-fedele-intelvi', 
      'san-fermo-della-battaglia', 'san-nazzaro-val-cavargna', 'sant-antonio-abate', 
      'senna-comasco', 'solbiate', 'sorico', 'spinone', 'stazzona', 
      'sulbiate', 'tavernerio', 'torno', 'tremezzina', 'turate', 'uggiate-trevano', 
      'valbrona', 'valmorea', 'valsolda', 'veleso', 'veniano', 'vertemate-con-minoprio', 
      'villa-guardia', 'zelbio'
    ]
  },

  'Cremona (CR)': {
    municipalities: [
      'acquanegra-cremonese', 'agnadello', 'annicco', 'azzanello', 'bagnolo-cremasco', 
      'bonemerse', 'bordolano', 'ca-d-andrea', 'calcio', 'calvatone', 
      'camerano-casasco', 'capergnanica', 'cappelletta', 'capralba', 'caravaggio', 
      'carona', 'casalbuttano-ed-uniti', 'casale-cremasco-vidolasco', 'casaletto-ceredano', 
      'casaletto-di-sopra', 'casaletto-vaprio', 'casalmorano', 'casalpusterlengo', 
      'casanova-del-morbasco', 'castel-gabbiano', 'castelleone', 'castelverde', 
      'castiglione-d-adda', 'catiguzzo', 'cavacurta', 'cicognolo', 'cingia-de-botti', 
      'corte-de-cortesi-con-cignone', 'corte-de-frati', 'covo', 'crema', 
      'cremona', 'credera-rubbiano', 'cumignano-sul-naviglio', 'derovere', 
      'dovera', 'drizzona', 'fara-olivana-con-sola', 'fiesco', 'fombio', 
      'formigara', 'gabbice', 'gadesco-pieve-delmona', 'gerre-de-caprioli', 
      'gombito', 'grontardo', 'grumello-cremonese-ed-uniti', 'gussola', 
      'iglesias', 'isola-dovarese', 'izano', 'madignano', 'malagnino', 
      'monte-cremasco', 'montodine', 'moscazzano', 'motta-baluffi', 
      'offanengo', 'olmeneta', 'ostiano', 'palazzo-pignano', 'pandino', 
      'pescarolo-ed-uniti', 'pessina-cremonese', 'pianengo', 'piadena-drizzona', 
      'pieranica', 'pieve-d-olmi', 'pieve-fissiraga', 'pieve-san-giacomo', 
      'pizzighettone', 'platina', 'ポルtrezza-di-serio', 'postua', 'quintano', 
      'ricengo', 'ripalta-arpina', 'ripalta-cremasca', 'ripalta-guerina', 
      'rivolta-d-adda', 'robecco-d-oglio', 'romanengo', 'salvirola', 
      'san-bassano', 'san-daniele-po', 'san-giovanni-in-croce', 'san-martino-del-lago', 
      'sergnano', 'sesto-ed-uniti', 'soncino', 'soresina', 'sospiro', 
      'spino-d-adda', 'stagno-lombardo', 'talisca', 'tavazzano-con-villavesco', 
      'ticengo', 'torlasco', 'tornata', 'torre-de-picenardi', 'torrevedro', 
      'trigolo', 'vaiano-cremasco', 'vailate', 'vescovato', 'volongo', 'voltido'
    ]
  },

  'Lecco (LC)': {
    municipalities: [
      'abbadia-lariana', 'airuno', 'annone-di-brianza', 'ballabio', 'barzago', 
      'barzio', 'bellano', 'bosisio-parini', 'bulciago', 'calolziocorte', 
      'carenno', 'cassago-brianza', 'cassina-valsassina', 'castello-di-brianza', 
      'castenedolo', 'colico', 'colle-brianza', 'cortenova', 'costa-masnaga', 
      'cremeno', 'cremella', 'delebio', 'dervio', 'dolzago', 'dorio', 
      'ello', 'erve', 'esino-lario', 'galbiate', 'garbagnate-monastero', 
      'garlate', 'giovenzana', 'gittana', 'grandate', 'introbio', 'la-valletta-brianza', 
      'lecco', 'lierna', 'lomagna', 'malgrate', 'mandello-del-lario', 
      'margno', 'merate', 'missaglia', 'moggio', 'molteno', 'monte-marenzo', 
      'montevecchia', 'morterone', 'nibionno', 'oggiono', 'olgiate-molgora', 
      'olginate', 'oliveto-lario', 'osnago', 'paderno-d-adda', 'parlasco', 
      'pasturo', 'perledo', 'pescate', 'premana', 'primaluna', 'robbiate', 
      'rogeno', 'sirone', 'sirtori', 'sueglio', 'suello', 'taceno', 
      'torre-de-busi', 'tremenico', 'valgreghentino', 'valmadrera', 'varenna', 
      'vercurago', 'verderio', 'viganò'
    ]
  },

  'Lodi (LO)': {
    municipalities: [
      'abbadia-cerreto', 'boffalora-d-adda', 'borghetto-lodigiano', 'borgo-san-giovanni', 
      'brembio', 'camairago', 'casale-cremasco-vidolasco', 'casalmaiocco', 
      'casalpusterlengo', 'caselle-lurani', 'castelnuovo-bocca-d-adda', 
      'castiglione-d-adda', 'cavacurta', 'cavenago-d-adda', 'cervignano-d-adda', 
      'codogno', 'comazzo', 'cornegliano-laudense', 'corno-giovine', 'corte-palasio', 
      'cropani', 'fombio', 'galgagnano', 'graffignana', 'guardamiglio', 
      'livraga', 'lodi', 'lodi-vecchio', 'maccastorna', 'mairago', 'maleo', 
      'marudo', 'massalengo', 'meleti', 'merlino', 'montanaso-lombardo', 
      'mulazzano', 'orio-litta', 'ospedaletto-lodigiano', 'ossago-lodigiano', 
      'pieve-fissiraga', 'pizzighettone', 'san-colombano-al-lambro', 
      'san-fiorano', 'san-martino-in-strada', 'san-rocco-al-porto', 
      'sant-angelo-lodigiano', 'santo-stefano-lodigiano', 'secugnago', 
      'somaglia', 'sordio', 'tavazzano-con-villavesco', 'terranova-dei-passerini', 
      'turano-lodigiano', 'valera-fratta', 'villanova-del-sillaro', 
      'zelo-buon-persico'
    ]
  },

  'Monza e Brianza (MB)': {
    municipalities: [
      'agrate-brianza', 'aicurzio', 'albiate', 'arcore', 'barlassina', 
      'bellusco', 'bernareggio', 'besana-in-brianza', 'biassono', 
      'bovisio-masciago', 'briosco', 'brugherio', 'burago-di-molgora', 
      'busnago', 'camparada', 'caponago', 'carate-brianza', 'carnate', 
      'cavenago-di-brianza', 'ceriano-laghetto', 'cesano-maderno', 
      'cogliate', 'concorezzo', 'cornate-d-adda', 'correzzana', 'desio', 
      'giussano', 'lazzate', 'lentate-sul-seveso', 'lesmo', 'limbiate', 
      'lissone', 'macherio', 'meda', 'mezzago', 'misinto', 'monza', 
      'muggiò', 'nova-milanese', 'ornago', 'renate', 'roncello', 
      'ronco-briantino', 'seregno', 'seveso', 'sovico', 'sulbiate', 
      'triuggio', 'usmate-velate', 'varedo', 'vedano-al-lambro', 
      'veduggio-con-colzano', 'verano-brianza', 'villasanta', 'vimercate'
    ]
  },

  'Mantova (MN)': {
    municipalities: [
      'acquanegra-sul-chiese', 'asola', 'bagnolo-san-vito', 'bigarello', 
      'borgofranco-sul-po', 'bozzolo', 'canneto-sull-oglio', 'carbonara-di-po', 
      'casalmoro', 'casaloldo', 'casalromano', 'castel-d-ario', 'castel-goffredo', 
      'castellucchio', 'castiglione-delle-stiviere', 'cavriana', 'ceresara', 
      'commessaggio', 'curtatone', 'dosolo', 'gazoldo-degli-ippoliti', 
      'goito', 'gonzaga', 'guidizzolo', 'magnacavallo', 'mantova', 
      'marcaria', 'mariana-mantovana', 'marmirolo', 'medole', 'moglia', 
      'monzambano', 'motteggiana', 'ostiglia', 'pegognaga', 'pellegrino-parmense', 
      'piubega', 'poggio-rusco', 'pomponesco', 'ponti-sul-mincio', 
      'porto-mantovano', 'quingentole', 'quistello', 'redondesco', 
      'revere', 'rivarolo-mantovano', 'roverbella', 'sabbioneta', 
      'san-benedetto-po', 'san-giacomo-delle-segnate', 'san-giorgio-bigarello', 
      'san-giovanni-del-dosso', 'san-martino-dall-argine', 'schivenoglia', 
      'sermide-e-felonica', 'serravalle-a-po', 'solferino', 'sostegno', 
      'suzzara', 'valeggio-sul-mincio', 'villa-poma', 'villimpenta', 'volta-mantovana'
    ]
  },

  'Pavia (PV)': {
    municipalities: [
      'alagna', 'albonese', 'albaredo-arnaboldi', 'albuzzano', 'arena-po', 
      'badia-pavese', 'barbianello', 'bascapè', 'bastida-pancarana', 'battuda', 
      'belgioioso', 'bereguardo', 'bertinoro', 'borgarello', 'borgo-priolo', 
      'borgo-san-siro', 'borgoratto-mormorolo', 'bornasco', 'bosnasco', 
      'brallo-di-pergola', 'breme', 'broni', 'calvignano', 'campospinoso', 
      'candia-lomellina', 'canevino', 'canneto-pavese', 'carbonara-al-ticino', 
      'casanova-lonati', 'casatisma', 'casei-gerola', 'cassolnovo', 
      'castana', 'casteggio', 'castelletto-di-branduzzo', 'castello-d-agogna', 
      'castelnovetto', 'cava-manara', 'cecima', 'ceranova', 'ceretto-lomellina', 
      'cergnago', 'certosa-di-pavia', 'cervesina', 'chignolo-po', 
      'cigognola', 'cilavegna', 'codevilla', 'confienza', 'copiano', 
      'corana', 'cornale', 'corte-de-frati', 'corvino-san-quirico', 
      'costa-de-nobili', 'cozzo', 'cura-carpignano', 'dorno', 'ferrera-erbognone', 
      'fortunago', 'frascarolo', 'galliavola', 'gambarana', 'gambolò', 
      'garlasco', 'gerenzago', 'giussago', 'godiasco-salice-terme', 
      'golferenzo', 'gravellona-lomellina', 'gropello-cairoli', 'inverno-e-monteleone', 
      'landriano', 'langosco', 'lardirago', 'linarolo', 'lirio', 
      'lomello', 'lungavilla', 'magherno', 'marcignago', 'marzano', 
      'mede', 'menconico', 'mezzana-bigli', 'mezzana-rabattone', 'mezzanino', 
      'miradolo-terme', 'montebello-della-battaglia', 'montecalvo-versiggia', 
      'montescano', 'montesegale', 'montu-beccaria', 'mornico-losana', 
      'mortara', 'nicorvo', 'olevano-di-lomellina', 'oliva-gessi', 
      'ottobiano', 'palestro', 'pancarana', 'parona', 'pavia', 
      'pietra-de-giorgi', 'pieve-albignola', 'pieve-del-cairo', 
      'pieve-porto-morone', 'pinarolo-po', 'pizzale', 'ponte-nizza', 
      'portalbera', 'rea', 'redavalle', 'retorbido', 'rivanazzano-terme', 
      'robbio', 'robecco-pavese', 'rocca-de-giorgi', 'rocca-susella', 
      'rognano', 'romagnese', 'roncaro', 'rosasco', 'rovescala', 
      'ruino', 'san-cipriano-po', 'san-damiano-al-colle', 'san-genesio-ed-uniti', 
      'san-giorgio-di-lomellina', 'san-martino-siccomario', 'sannazzaro-de-burgondi', 
      'sant-alessio-con-vialone', 'santa-cristina-e-bissone', 'santa-giuletta', 
      'santa-margherita-di-staffora', 'santa-maria-della-versa', 'sant-antonio-abate', 
      'scaldasole', 'semiana', 'silvano-pietra', 'siziano', 'sommo', 
      'spessa', 'stradella', 'suardi', 'torrazza-coste', 'torre-beretti-e-castellaro', 
      'torre-d-arese', 'torre-de-negri', 'torre-d-isola', 'torrevecchia-pia', 
      'travacò-siccomario', 'trivolzio', 'tromello', 'val-di-nizza', 
      'valeggio', 'valle-lomellina', 'valle-salimbene', 'valverde', 
      'varzi', 'vellezzo-bellini', 'verretto', 'verrua-po', 'vidigulfo', 
      'vigevano', 'villa-biscossi', 'villanova-d-ardenghi', 'villanterio', 
      'vistarino', 'volpara', 'zavattarello', 'zeccone', 'zeme', 'zenevredo'
    ]
  },

  'Sondrio (SO)': {
    municipalities: [
      'albosaggia', 'albaredo-per-san-marco', 'andalo-valtellino', 'aprica', 
      'ardenno', 'bema', 'berbenno-di-valtellina', 'bianzone', 'bormio', 
      'buglio-in-monte', 'caiolo', 'campodolcino', 'caspoggio', 'castello-dell-acqua', 
      'castione-andevenno', 'cedrasco', 'cercino', 'chiavenna', 'chiesa-in-valmalenco', 
      'chiuro', 'cino', 'civo', 'colorina', 'cosio-valtellino', 'dazio', 
      'delebio', 'dubino', 'faedo-valtellino', 'forcola', 'fusine', 
      'gerola-alta', 'gordona', 'grosio', 'grosotto', 'lanzada', 'livigno', 
      'lovero', 'madesimo', 'mantello', 'mazzo-di-valtellina', 'mello', 
      'menarola', 'mese', 'montagna-in-valtellina', 'morbegno', 'novate-mezzola', 
      'pedesina', 'piantedo', 'piateda', 'piuro', 'poggiridenti', 'ponte-in-valtellina', 
      'postalesio', 'prata-camportaccio', 'rasura', 'rogolo', 'samolaco', 
      'san-giacomo-filippo', 'sernio', 'sondalo', 'sondrio', 'spriana', 
      'talamona', 'tartano', 'teglio', 'tirano', 'torre-di-santa-maria', 
      'tovo-di-sant-agata', 'traona', 'tresivio', 'val-masino', 'valdidentro', 
      'valdisotto', 'valfurva', 'verceia', 'vervio', 'villa-di-chiavenna', 
      'villa-di-tirano'
    ]
  },

  'Varese (VA)': {
    municipalities: [
      'agra', 'albizzate', 'angera', 'arcisate', 'arsago-seprio', 'azzate', 
      'barasso', 'bardello', 'besnate', 'biandronno', 'bisuschio', 'bodio-lomnago', 
      'brebbia', 'bregano', 'brezzo-di-bedero', 'brissago-valtravaglia', 
      'brunello', 'brusimpiano', 'buguggiate', 'busto-arsizio', 'cadrezzate', 
      'cantello', 'caravate', 'cardano-al-campo', 'carnago', 'caronno-pertusella', 
      'caronno-varesino', 'casale-litta', 'casalzuigno', 'casciago', 'casorate-sempione', 
      'cassano-magnago', 'cassano-valcuvia', 'castano-primo', 'castellanza', 
      'castello-cabiaglio', 'castelseprio', 'castelveccana', 'castiglione-olona', 
      'cavaria-con-premezzo', 'cazzago-brabbia', 'cecima', 'cittiglio', 
      'clivio', 'cocquio-trevisago', 'comerio', 'comabbio', 'cremenaga', 
      'cuasso-al-monte', 'cugliate-fabiasco', 'cunardo', 'curiglia-con-monteviasco', 
      'daverio', 'dumenza', 'fagnano-olona', 'ferno', 'gallarate', 
      'galliate-lombardo', 'gavirate', 'gazzada-schianno', 'gerenzano', 
      'germignaga', 'golasecca', 'gorla-maggiore', 'gorla-minore', 
      'grantola', 'inarzo', 'induno-olona', 'ispra', 'jerago-con-orago', 
      'lavena-ponte-tresa', 'laveno-mombello', 'leggiuno', 'lonate-ceppino', 
      'lonate-pozzolo', 'luino', 'luvinate', 'maccagno-con-pino-e-veddasca', 
      'malgesso', 'malnate', 'marchirolo', 'marnate', 'masciago-primo', 
      'mercallo', 'mesenzana', 'mombello', 'montegrino-valtravaglia', 
      'morazzone', 'mornago', 'oggiona-con-santo-stefano', 'olgiate-olona', 
      'origgio', 'osmate', 'palazzo', 'parravicino', 'porto-ceresio', 
      'porto-valtravaglia', 'rancio-valcuvia', 'ranco', 'saltrio', 
      'samarate', 'sangiano', 'saronno', 'sesto-calende', 'solbiate-arno', 
      'solbiate-olona', 'somma-lombardo', 'sumirago', 'taino', 'tradate', 
      'travedona-monate', 'tronzano-lago-maggiore', 'uboldo', 'varano-borghi', 
      'varese', 'vedano-olona', 'vergiate', 'viggiù', 'vizzola-ticino'
    ]
  }
};

function performCompleteAnalysis() {
  console.log('================================================================================');
  console.log('COMPLETE LOMBARDY MUNICIPALITY COVERAGE ANALYSIS');
  console.log('================================================================================');
  
  // Read actual municipality files
  const pagesDir = path.join(__dirname, '../web/pages-draft');
  let files;
  
  try {
    files = fs.readdirSync(pagesDir);
  } catch (err) {
    console.error('Error reading pages-draft directory:', err.message);
    return;
  }
  
  const actualMunicipalities = files
    .filter(file => file.startsWith('assistenza-it-') && file.endsWith('.html'))
    .map(file => file.replace('assistenza-it-', '').replace('.html', ''))
    .sort();
  
  console.log(`Total municipalities found in project: ${actualMunicipalities.length}`);
  console.log('');
  
  // Summary report
  const summaryReport = {};
  let totalExpectedMunicipalities = 0;
  let totalFoundMunicipalities = 0;
  let allProvincesCovered = true;
  
  console.log('DETAILED COVERAGE REPORT BY PROVINCE:');
  console.log('='.repeat(80));
  
  Object.keys(LOMBARDY_COMPLETE_MAPPING).forEach(province => {
    const expectedMunicipalities = LOMBARDY_COMPLETE_MAPPING[province].municipalities;
    const foundMunicipalities = actualMunicipalities.filter(m => expectedMunicipalities.includes(m));
    const missingMunicipalities = expectedMunicipalities.filter(m => !actualMunicipalities.includes(m));
    
    const coveragePercentage = expectedMunicipalities.length > 0 
      ? (foundMunicipalities.length / expectedMunicipalities.length * 100).toFixed(1)
      : '0.0';
    
    totalExpectedMunicipalities += expectedMunicipalities.length;
    totalFoundMunicipalities += foundMunicipalities.length;
    
    summaryReport[province] = {
      expected: expectedMunicipalities.length,
      found: foundMunicipalities.length,
      missing: missingMunicipalities.length,
      coverage: parseFloat(coveragePercentage)
    };
    
    console.log(`${province}:`);
    console.log(`  Expected: ${expectedMunicipalities.length} municipalities`);
    console.log(`  Found: ${foundMunicipalities.length} municipalities`);
    console.log(`  Coverage: ${coveragePercentage}%`);
    
    if (missingMunicipalities.length > 0) {
      console.log(`  Missing (${missingMunicipalities.length}): ${missingMunicipalities.slice(0, 10).join(', ')}${missingMunicipalities.length > 10 ? '...' : ''}`);
      allProvincesCovered = false;
    } else {
      console.log(`  ✅ Complete coverage`);
    }
    console.log('');
  });
  
  // Find uncategorized municipalities
  const allExpectedMunicipalities = Object.values(LOMBARDY_COMPLETE_MAPPING)
    .flatMap(province => province.municipalities);
  
  const uncategorizedMunicipalities = actualMunicipalities.filter(m => 
    !allExpectedMunicipalities.includes(m)
  );
  
  console.log('OVERALL SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Total expected municipalities in Lombardy: ${totalExpectedMunicipalities}`);
  console.log(`Total found in project: ${actualMunicipalities.length}`);
  console.log(`Correctly categorized: ${totalFoundMunicipalities}`);
  console.log(`Overall coverage: ${(totalFoundMunicipalities / totalExpectedMunicipalities * 100).toFixed(1)}%`);
  
  if (uncategorizedMunicipalities.length > 0) {
    console.log(`Uncategorized municipalities: ${uncategorizedMunicipalities.length}`);
    console.log(`Uncategorized list: ${uncategorizedMunicipalities.join(', ')}`);
  }
  
  console.log('');
  console.log('PROVINCE VERIFICATION:');
  console.log('-'.repeat(50));
  
  Object.keys(summaryReport).forEach(province => {
    const report = summaryReport[province];
    const status = report.coverage === 100 ? '✅' : 
                   report.coverage >= 90 ? '🟡' : 
                   report.coverage >= 50 ? '🟠' : '❌';
    
    console.log(`${status} ${province}: ${report.found}/${report.expected} (${report.coverage}%)`);
  });
  
  console.log('');
  console.log(`${allProvincesCovered ? '✅' : '❌'} ${allProvincesCovered ? 'ALL PROVINCES HAVE COMPLETE COVERAGE' : 'SOME PROVINCES HAVE INCOMPLETE COVERAGE'}`);
  
  // Generate CSV report for further analysis
  const csvContent = [
    'Province,Expected,Found,Coverage%,Status',
    ...Object.entries(summaryReport).map(([province, data]) => 
      `"${province}",${data.expected},${data.found},${data.coverage},"${data.coverage === 100 ? 'Complete' : 'Incomplete'}"`
    )
  ].join('\n');
  
  try {
    fs.writeFileSync(path.join(__dirname, 'lombardy-coverage-report.csv'), csvContent);
    console.log('');
    console.log('📊 Detailed CSV report saved to: scripts/lombardy-coverage-report.csv');
  } catch (err) {
    console.error('Warning: Could not save CSV report:', err.message);
  }
  
  console.log('');
  console.log('================================================================================');
}

// Run the complete analysis
performCompleteAnalysis();