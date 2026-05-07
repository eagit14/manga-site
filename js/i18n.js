// ── Internationalisation: getLang, setLang, applyTranslations ──

const TRANSLATIONS = {

  en: {
    // Login
    login_tagline: 'The Art That Changed Everything — Sign in to continue',
    login_btn: 'Sign in with Google',
    nav_signin: 'Sign in with Google',

    // Nav
    nav_origins:   'Origins',
    nav_top_mangas:'Top Mangas',
    nav_top_films: 'Top Movies',
    nav_my_stories:'📊 My Stories',
    nav_create:    '✏️ Create',
    nav_my_mangas: '📚 My Picture Books',  // updated

    // User dropdown
    dropdown_profile: 'My Profile',
    dropdown_signout: 'Sign out',

    // Hero
    hero_badge: '🎌 Since 1814 · The Japanese Comic That Rocks!',
    hero_subtitle: 'From ancient illuminated scrolls to a planetary phenomenon — manga is not just an art. It is a <strong>language</strong>, a <strong>philosophy</strong>, and a wide-open window into the soul of Japan.',
    hero_scroll: 'Scroll ↓',

    // Origin section
    origin_label: '⚡ The Origin Story',
    origin_title: 'How Manga <span class="red">Revolutionized</span> the World!',
    origin_era_1: '12th Century',
    origin_title_1: 'The First Scrolls',
    origin_text_1: 'It all starts in Heian-period Japan. Buddhist monk Toba Sōjō creates the <em>Chōjū-jinbutsu-giga</em> — ink scrolls depicting animals dressed as monks, telling satirical stories in sequential images. Six centuries ahead of Western comics! 🐸',
    origin_era_2: 'Early 19th Century',
    origin_title_2: 'Hokusai Invents a Word',
    origin_text_2: 'In 1814, legendary printmaking master <strong>Katsushika Hokusai</strong> publishes his <em>Hokusai Manga</em> — wild sketchbooks. He merges <em>man</em> (whimsical) and <em>ga</em> (images), accidentally inventing the name of a medium that would conquer the planet. Thank you Hokusai! 🎨',
    origin_era_3: 'Post-war 1945',
    origin_title_3: 'The God of Manga Was Born',
    origin_text_3: 'After World War II, <strong>Osamu Tezuka</strong> revolutionizes everything. Inspired by Disney and cinema, he introduces cinematic storytelling, compelling characters and long narratives. His masterpiece <em>Shin Takarajima</em> sells 400,000 copies. Modern manga was born! 💥',
    origin_era_4: '1960–1980',
    origin_title_4: 'Shōnen & Shōjo Arrive',
    origin_text_4: 'Manga diversifies: <em>shōnen</em> (teenage boys), <em>shōjo</em> (teenage girls), <em>seinen</em> (adults). In 1968, Shueisha launches the <em>Weekly Shōnen Jump</em>, the legendary anthology that would carry Dragon Ball, Naruto and One Piece to every corner of the world. 🔥',
    origin_era_5: '1980–2000',
    origin_title_5: 'Manga Conquers the World',
    origin_text_5: 'The film <em>Akira</em> (1988) blows Western minds. Sailor Moon, Dragon Ball Z, then the internet propel manga across Europe, America, everywhere. A cultural wave that permanently redraws the landscape of global pop culture. 🌍',
    origin_era_6: '21st Century',
    origin_title_6: 'A €15 Billion Industry',
    origin_text_6: 'One Piece alone exceeds <strong>530 million copies</strong> sold — more than any other comic series in the history of humanity. Streaming platforms, international publishers and a new generation of creators make manga a universal language. 🚀',

    // Top manga books
    books_label: '🏆 The Absolute Legends',
    books_title: 'Top 10<br/><span class="yellow">Series</span> Manga',
    books_desc: 'The series that defined generations, shattered sales records, and turned millions of readers into lifelong fans. 📚',
    books_cta: 'Read now →',

    // Data / my picture books
    data_label: '📊 Database',
    data_title: 'My <span class="yellow">Picture Books</span>',
    data_stories: 'Stories',
    data_ai: 'AI-generated',
    data_genres: 'Different genres',
    data_search_ph: '🔍 Search a story…',
    data_clear: '🗑 Clear all',

    // Top movies
    movies_label: '🎬 On the Big Screen',
    movies_title: 'Top 10<br/><span class="red">Movies</span> Manga',
    movies_desc: 'The animated films that proved manga can move, shock and make you cry just as hard as any live-action film. 🎥',
    movies_cta: 'Watch →',

    // Creator
    creator_label: '✏️ Creative Studio',
    creator_title: 'Create your <span class="yellow">Story Book</span>!',
    creator_desc: 'Got an idea brewing in your head? Describe your hero, your scenes, your story — we\'ll generate an illustrated story book worthy of the greatest publishers. 🖊️',
    form_title_lbl: '📝 Your story title',
    form_title_ph: 'e.g. Shadow of the Last Samurai, Neon Butterfly…',
    form_genre_lbl: '🎭 Genre',
    form_style_lbl: '🎨 Art style',
    form_hero_lbl: '🦸 Hero / heroine name',
    form_hero_ph: 'e.g. Ryō, Sakura, Jin, Akemi…',
    form_universe_lbl: '🌍 Universe & setting',
    form_universe_ph: 'e.g. Dystopian Tokyo, medieval kingdom, high school…',
    form_herodesc_lbl: '✨ Describe your hero / heroine',
    form_herodesc_ph: 'e.g. A brilliant but lonely high school girl who hides a power she doesn\'t yet understand…',
    form_photo_lbl: '📸 Hero photo',
    form_photo_upload: 'Click to upload a photo of your hero\'s face',
    form_photo_hint: 'Required — ChatGPT will analyse the face and reproduce it consistently in every illustration.',
    form_photo_remove: '✕ Remove',
    err_hero_photo: '⚠ A hero face photo is required to generate images.',
    form_char2_lbl: '📸 Another character photo',
    form_premise_lbl: '💡 Your pitch — the starting idea!',
    form_premise_ph: 'e.g. When her brother is captured by a secret organisation, she discovers that her recurring nightmares are actually visions of the future…',
    form_premise_hint: 'The more detail you add, the more epic the result! Describe the stakes, twists, atmosphere…',
    err_premise: '⚠ Please describe your starting pitch.',
    form_chapters_lbl: '🎬 Scenes',
    form_add_chapter: '＋ Add a scene',
    err_chapters: '⚠ Please add at least one scene.',
    form_ending_lbl: '🏁 Ending — how does it finish?',
    form_ending_ph: 'e.g. After defeating the organisation, she discovers her brother was the mastermind all along… but she chooses to forgive him.',
    form_ending_hint: 'Describe how the story ends — this shapes the generated illustrations.',
    err_fin: '⚠ Please describe the ending.',
    gen_btn: '🎨 Generate my Story Book!',
    genre_options: [
      ['shonen',  'Shōnen (Action / Adventure)'],
      ['shojo',   'Shōjo (Romance / Emotions)'],
      ['seinen',  'Seinen (Adult / Complex)'],
      ['isekai',  'Isekai (Another world)'],
      ['horreur', 'Horror (Thrills)'],
      ['sf',      'Science-Fiction'],
      ['comedie', 'Comedy'],
      ['sport',   'Sport'],
    ],
    style_options: [
      ['dynamique', 'Dynamic & explosive'],
      ['elegant',   'Elegant & detailed'],
      ['sombre',    'Dark & atmospheric'],
      ['doux',      'Soft & poetic'],
      ['retro',     '90s retro'],
      ['moderne',   'Modern & minimalist'],
    ],

    // My Picture Books
    my_mangas_label: '📚 Your Picture Books',
    my_mangas_title: 'My <span class="red">Picture Books</span>',
    my_mangas_desc: 'All the illustrated stories you\'ve created — order any of them as a printed picture book.',

    // Footer
    footer_tagline: 'The Art That Changed the World ♥ From 1814 to Infinity',

    // Payment modal
    promo_toggle: '🎟 Have a promo code?',
    promo_ph: 'Enter code',
    promo_apply: 'Apply',
    modal_export: '📄 Export PDF',
    payment_secure: '100% secure payment by',
    payment_secure2: '. Your card details are never stored on this site.',

    // Profile modal
    profile_header_lbl: 'Account',
    profile_title: 'My Profile',
    profile_dropdown_item: 'My Profile',
    profile_fname_lbl: 'First Name',
    profile_lname_lbl: 'Last Name',
    profile_addr1_lbl: 'Address Line 1',
    profile_addr2_lbl: 'Address Line 2',
    profile_addr2_opt: '(optional)',
    profile_city_lbl: 'City',
    profile_postal_lbl: 'Postal Code',
    profile_country_lbl: 'Country',
    profile_save: '💾 Save',

    // Delete modal
    delete_title: 'Delete Story?',
    delete_msg: 'This will permanently remove the story and all its images.',
    delete_cancel: 'Cancel',
    delete_btn: 'Delete',

    // Manga tile buttons & badges
    tile_view:             '👁 View Pictures',
    tile_view_cover:       '📖 View Manga',
    tile_order_digital:    '🛒 Order Digital',
    tile_order_physical:   '🖨️ Order Physical',
    tile_export_pdf:       '📄 Export PDF',
    tile_status_ordered:   '✅ Ordered',
    tile_status_generated: '⚡ Generated',
    tile_cannot_edit:      'Cannot edit — already ordered',
    tile_loading:          'Loading your stories…',

    // Login wall — tabs & buttons
    lw_tab_signin: 'Sign In',
    lw_tab_signup: 'Sign Up',
    lw_email_ph: 'Email address',
    lw_password_ph: 'Password',
    lw_password_new_ph: 'Password (min. 6 characters)',
    lw_confirm_ph: 'Confirm password',
    lw_signin_btn: 'Sign In',
    lw_signup_btn: 'Create Account',
    lw_or: 'or continue with',

    // Data toolbar
    data_filter_all: 'All genres',

    // Creator — extra UI
    credits_left: 'credits left',
    no_credits: 'No credits left —',
    refill_link: 'Refill credits',
    save_draft: '💾 Save',
    form_char2_name_lbl: '👤 Character name',
    form_char2_name_hint: '(mention in scenes to include)',
    form_char2_name_ph: 'e.g. Maya, Sensei Riku, Uncle Kai…',
    form_bubbles_lbl: '💬 Panel style',
    form_bubbles_with: 'With speech bubbles',
    form_bubbles_without: 'Illustrations only',
    form_quality_lbl: '⚡ Image quality',
    form_quality_draft: 'Draft — fastest & cheapest (~€0.01/image)',
    form_quality_std: 'Standard — good quality (~€0.04/image)',
    form_quality_hi: 'Premium — best quality (~€0.17/image)',
    loading_text: '✍️ Your inner mangaka is awakening…',
    surprise_text: '✨ No idea yet? Let fate decide.',
    surprise_btn: '🎲 Surprise Me!',
    edit_cancel: '✕ Cancel',

    // My mangas empty state
    my_mangas_empty: 'No stories yet — <a href="#creer">create your first one!</a>',

    // Physical (Lulu) modal
    physical_subtitle: '🖨️ Printed &amp; shipped by <strong>Lulu</strong>',
    physical_format_lbl: 'Format',
    physical_binding_lbl: 'Binding',
    physical_interior_lbl: 'Interior',
    physical_pages_lbl: 'Pages',
    physical_fulfillment_lbl: 'Fulfillment',
    physical_fulfillment_val: 'Lulu print-on-demand',
    physical_delivery_lbl: 'Delivery',
    physical_delivery_val: '7–14 business days',
    physical_price_loading: 'Fetching Lulu price…',
    physical_print_cost: 'Print cost (Lulu)',
    physical_shipping_title: '📦 Shipping address',
    physical_firstname_ph: 'First name',
    physical_lastname_ph: 'Last name',
    physical_addr1_ph: 'Address line 1',
    physical_addr2_ph: 'Address line 2 (optional)',
    physical_city_ph: 'City',
    physical_postal_ph: 'Postal code',
    physical_state_ph: 'State / Province',
    physical_note: 'After payment your book is sent to Lulu for printing. A shipping confirmation will arrive at your email within 24 hours.',

    // Duplicate modal
    duplicate_title: 'Duplicate Story?',
    duplicate_msg_prefix: 'Create a copy of',
    duplicate_cancel: 'Cancel',
    duplicate_btn: 'Duplicate',

    // Remove scene modal
    remove_scene_title: 'Remove Scene?',
    remove_scene_prefix: 'Remove',
    remove_scene_suffix: '? This cannot be undone.',
    remove_scene_cancel: 'Cancel',
    remove_scene_btn: 'Remove',

    // Credits modal
    credits_modal_title: 'Refill Image Credits',
    credits_modal_desc: 'Get <strong>50 more image generations</strong> to keep building your story.',

    // Support modal
    support_modal_title: '💬 Contact Support',
    support_title_lbl: 'Title',
    support_title_ph: 'Brief summary of your issue…',
    support_desc_lbl: 'Description',
    support_desc_ph: 'Describe your issue in detail…',
    support_cancel: 'Cancel',
    support_submit: 'Send to Support',
    support_success_msg: 'Your message has been sent! We\'ll get back to you soon.',
    support_close: 'Close',
    my_tickets_title: 'My Tickets',
  },

  // ─────────────────────────────────────────────
  fr: {
    login_tagline: 'L\'Art qui a Tout Changé — Connectez-vous pour continuer',
    login_btn: 'Se connecter avec Google',
    nav_signin: 'Se connecter avec Google',

    nav_origins:   'Origines',
    nav_top_mangas:'Top Mangas',
    nav_top_films: 'Top Films',
    nav_my_stories:'📊 Mes Histoires',
    nav_create:    '✏️ Créer',
    nav_my_mangas: '📚 Mes Livres Illustrés',

    dropdown_profile: 'Mon Profil',
    dropdown_signout: 'Se déconnecter',

    hero_badge: '🎌 Depuis 1814 · La BD Japonaise Qui Déchire !',
    hero_subtitle: 'Des anciens rouleaux enluminés à un phénomène planétaire — le manga n\'est pas qu\'un art. C\'est un <strong>langage</strong>, une <strong>philosophie</strong>, et une fenêtre grande ouverte sur l\'âme du Japon.',
    hero_scroll: 'Défiler ↓',

    origin_label: '⚡ L\'Histoire des Origines',
    origin_title: 'Comment le Manga a <span class="red">Révolutionné</span> le Monde !',
    origin_era_1: 'XIIe siècle',
    origin_title_1: 'Les Premiers Rouleaux',
    origin_text_1: 'Tout commence au Japon de la période Heian. Le moine bouddhiste Toba Sōjō crée les <em>Chōjū-jinbutsu-giga</em> — des rouleaux d\'encre représentant des animaux habillés en moines, racontant des histoires satiriques en images séquentielles. Six siècles d\'avance sur la BD occidentale ! 🐸',
    origin_era_2: 'Début XIXe',
    origin_title_2: 'Hokusai Invente un Mot',
    origin_text_2: 'En 1814, le légendaire maître de l\'estampe <strong>Katsushika Hokusai</strong> publie ses <em>Hokusai Manga</em> — des carnets de croquis fous. Il fusionne <em>man</em> (fantaisiste) et <em>ga</em> (images), et invente accidentellement le nom d\'un médium qui allait conquérir la planète. Merci Hokusai ! 🎨',
    origin_era_3: 'Après-guerre 1945',
    origin_title_3: 'Le Dieu du Manga Est Né',
    origin_text_3: 'Après la Seconde Guerre mondiale, <strong>Osamu Tezuka</strong> révolutionne tout. Inspiré par Disney et le cinéma, il introduit des mises en scène cinématographiques, des personnages attachants et des récits longs. Son chef-d\'œuvre <em>Shin Takarajima</em> s\'écoule à 400 000 exemplaires. Le manga moderne est né ! 💥',
    origin_era_4: '1960–1980',
    origin_title_4: 'Shōnen & Shōjo Débarquent',
    origin_text_4: 'Le manga se diversifie : <em>shōnen</em> (ados garçons), <em>shōjo</em> (ados filles), <em>seinen</em> (adultes). En 1968, Shueisha lance le <em>Weekly Shōnen Jump</em>, l\'anthologie légendaire qui portera Dragon Ball, Naruto et One Piece aux quatre coins du monde. 🔥',
    origin_era_5: '1980–2000',
    origin_title_5: 'Le Manga Conquiert le Monde',
    origin_text_5: 'Le film <em>Akira</em> (1988) fait exploser la cervelle des Occidentaux. Sailor Moon, Dragon Ball Z, puis internet propulsent le manga en Europe, en Amérique, partout. Une vague culturelle qui redessine le paysage de la pop culture mondiale pour toujours. 🌍',
    origin_era_6: 'XXIe siècle',
    origin_title_6: 'Une Industrie à 15 Milliards €',
    origin_text_6: 'One Piece seul dépasse les <strong>530 millions d\'exemplaires</strong> vendus — plus que n\'importe quelle autre série de BD dans l\'histoire de l\'humanité. Les plateformes de streaming, les éditeurs internationaux et une nouvelle génération de créateurs font du manga un langage universel. 🚀',

    books_label: '🏆 Les Légendes Absolues',
    books_title: 'Top 10<br/><span class="yellow">Séries</span> Manga',
    books_desc: 'Les séries qui ont défini des générations, fracassé des records de vente, et transformé des millions de lecteurs en fans à vie. 📚',
    books_cta: 'Lire maintenant →',

    data_label: '📊 Base de données',
    data_title: 'Mes <span class="yellow">Livres Illustrés</span>',
    data_stories: 'Histoires',
    data_ai: 'Générés avec IA',
    data_genres: 'Genres différents',
    data_search_ph: '🔍 Rechercher une histoire…',
    data_clear: '🗑 Tout effacer',

    movies_label: '🎬 Sur Grand Écran',
    movies_title: 'Top 10<br/><span class="red">Films</span> Manga',
    movies_desc: 'Les films d\'animation qui ont prouvé que le manga peut émouvoir, choquer et faire pleurer aussi fort que n\'importe quel film en prise de vue réelle. 🎥',
    movies_cta: 'Regarder →',

    creator_label: '✏️ Studio Créatif',
    creator_title: 'Créez votre <span class="yellow">Livre Illustré</span> !',
    creator_desc: 'Une idée qui mijote dans votre tête ? Décrivez votre héros, vos scènes, votre histoire — nous générerons un livre illustré digne des plus grands éditeurs. 🖊️',
    form_title_lbl: '📝 Titre de votre histoire',
    form_title_ph: 'ex. Ombre du Dernier Samouraï, Papillon Néon…',
    form_genre_lbl: '🎭 Genre',
    form_style_lbl: '🎨 Style artistique',
    form_hero_lbl: '🦸 Nom du héros / héroïne',
    form_hero_ph: 'ex. Ryō, Sakura, Jin, Akemi…',
    form_universe_lbl: '🌍 Univers & décor',
    form_universe_ph: 'ex. Tokyo dystopique, royaume médiéval, lycée…',
    form_herodesc_lbl: '✨ Décrivez votre héros / héroïne',
    form_herodesc_ph: 'ex. Une lycéenne brillante mais solitaire qui cache un pouvoir qu\'elle ne comprend pas encore…',
    form_photo_lbl: '📸 Photo du héros',
    form_photo_upload: 'Cliquez pour uploader une photo du visage de votre héros',
    form_photo_hint: 'Obligatoire — ChatGPT analysera le visage et le reproduira dans chaque illustration générée.',
    form_photo_remove: '✕ Supprimer',
    err_hero_photo: '⚠ Une photo du visage du héros est obligatoire pour générer les illustrations.',
    form_char2_lbl: '📸 Photo d\'un autre personnage',
    form_premise_lbl: '💡 Votre pitch — l\'idée de départ !',
    form_premise_ph: 'ex. Quand son frère est capturé par une organisation secrète, elle découvre que ses cauchemars récurrents sont en réalité des visions du futur…',
    form_premise_hint: 'Plus vous ajoutez de détails, plus le résultat sera épique ! Décrivez les enjeux, rebondissements, atmosphère…',
    err_premise: '⚠ Décrivez votre pitch de départ.',
    form_chapters_lbl: '🎬 Scènes',
    form_add_chapter: '＋ Ajouter une scène',
    err_chapters: '⚠ Ajoutez au moins une scène.',
    form_ending_lbl: '🏁 Final — comment ça se termine ?',
    form_ending_ph: 'ex. Après avoir vaincu l\'organisation, elle découvre que son frère en était le cerveau… mais elle choisit de lui pardonner.',
    form_ending_hint: 'Décrivez comment l\'histoire se termine — cela influence les illustrations générées.',
    err_fin: '⚠ Décrivez le final.',
    gen_btn: '🎨 Générer mon Livre Illustré !',
    genre_options: [
      ['shonen',  'Shōnen (Action / Aventure)'],
      ['shojo',   'Shōjo (Romance / Émotions)'],
      ['seinen',  'Seinen (Adulte / Complexe)'],
      ['isekai',  'Isekai (Un autre monde)'],
      ['horreur', 'Horreur (Frissons)'],
      ['sf',      'Science-Fiction'],
      ['comedie', 'Comédie'],
      ['sport',   'Sport'],
    ],
    style_options: [
      ['dynamique', 'Dynamique & explosif'],
      ['elegant',   'Élégant & détaillé'],
      ['sombre',    'Sombre & atmosphérique'],
      ['doux',      'Doux & poétique'],
      ['retro',     'Rétro 90s'],
      ['moderne',   'Moderne & minimaliste'],
    ],

    my_mangas_label: '📚 Vos Livres Illustrés',
    my_mangas_title: 'Mes <span class="red">Livres Illustrés</span>',
    my_mangas_desc: 'Toutes les histoires illustrées que vous avez créées — commandez-les en volume imprimé.',

    footer_tagline: 'L\'Art qui a Changé le Monde ♥ De 1814 à l\'Infini',

    promo_toggle: '🎟 Vous avez un code promo ?',
    promo_ph: 'Entrez le code',
    promo_apply: 'Appliquer',
    modal_export: '📄 Exporter PDF',
    payment_secure: 'Paiement 100% sécurisé par',
    payment_secure2: '. Vos coordonnées bancaires ne sont jamais stockées sur ce site.',

    profile_header_lbl: 'Compte',
    profile_title: 'Mon Profil',
    profile_dropdown_item: 'Mon Profil',
    profile_fname_lbl: 'Prénom',
    profile_lname_lbl: 'Nom',
    profile_addr1_lbl: 'Adresse ligne 1',
    profile_addr2_lbl: 'Adresse ligne 2',
    profile_addr2_opt: '(optionnel)',
    profile_city_lbl: 'Ville',
    profile_postal_lbl: 'Code Postal',
    profile_country_lbl: 'Pays',
    profile_save: '💾 Enregistrer',

    delete_title: 'Supprimer l\'Histoire ?',
    delete_msg: 'Cela supprimera définitivement l\'histoire et toutes ses images.',
    delete_cancel: 'Annuler',
    delete_btn: 'Supprimer',

    // Manga tile buttons & badges
    tile_view:             '👁 Voir les illustrations',
    tile_view_cover:       '📖 Voir le manga',
    tile_order_digital:    '🛒 Commander numérique',
    tile_order_physical:   '🖨️ Commander physique',
    tile_export_pdf:       '📄 Exporter PDF',
    tile_status_ordered:   '✅ Commandé',
    tile_status_generated: '⚡ Généré',
    tile_cannot_edit:      'Modification impossible — déjà commandé',
    tile_loading:          'Chargement de vos histoires…',

    // Login wall — tabs & buttons
    lw_tab_signin: 'Se connecter',
    lw_tab_signup: 'S\'inscrire',
    lw_email_ph: 'Adresse e-mail',
    lw_password_ph: 'Mot de passe',
    lw_password_new_ph: 'Mot de passe (min. 6 caractères)',
    lw_confirm_ph: 'Confirmer le mot de passe',
    lw_signin_btn: 'Se connecter',
    lw_signup_btn: 'Créer un compte',
    lw_or: 'ou continuer avec',

    // Data toolbar
    data_filter_all: 'Tous les genres',

    // Creator — extra UI
    credits_left: 'crédits restants',
    no_credits: 'Plus de crédits —',
    refill_link: 'Recharger',
    save_draft: '💾 Enregistrer',
    form_char2_name_lbl: '👤 Nom du personnage',
    form_char2_name_hint: '(mentionnez dans les scènes pour l\'inclure)',
    form_char2_name_ph: 'ex. Maya, Sensei Riku, Oncle Kai…',
    form_bubbles_lbl: '💬 Style de panneaux',
    form_bubbles_with: 'Avec bulles de dialogue',
    form_bubbles_without: 'Illustrations uniquement',
    form_quality_lbl: '⚡ Qualité des images',
    form_quality_draft: 'Brouillon — plus rapide & économique (~0,01€/image)',
    form_quality_std: 'Standard — bonne qualité (~0,04€/image)',
    form_quality_hi: 'Premium — meilleure qualité (~0,17€/image)',
    loading_text: '✍️ Votre mangaka intérieur s\'éveille…',
    surprise_text: '✨ Pas encore d\'idée ? Laissez le destin décider.',
    surprise_btn: '🎲 Surprenez-moi !',
    edit_cancel: '✕ Annuler',

    // My mangas empty state
    my_mangas_empty: 'Aucune histoire pour l\'instant — <a href="#creer">créez la première !</a>',

    // Physical (Lulu) modal
    physical_subtitle: '🖨️ Imprimé &amp; expédié par <strong>Lulu</strong>',
    physical_format_lbl: 'Format',
    physical_binding_lbl: 'Reliure',
    physical_interior_lbl: 'Intérieur',
    physical_pages_lbl: 'Pages',
    physical_fulfillment_lbl: 'Impression',
    physical_fulfillment_val: 'Impression à la demande Lulu',
    physical_delivery_lbl: 'Livraison',
    physical_delivery_val: '7–14 jours ouvrables',
    physical_price_loading: 'Récupération du prix Lulu…',
    physical_print_cost: 'Coût d\'impression (Lulu)',
    physical_shipping_title: '📦 Adresse de livraison',
    physical_firstname_ph: 'Prénom',
    physical_lastname_ph: 'Nom',
    physical_addr1_ph: 'Adresse ligne 1',
    physical_addr2_ph: 'Adresse ligne 2 (optionnel)',
    physical_city_ph: 'Ville',
    physical_postal_ph: 'Code postal',
    physical_state_ph: 'État / Province',
    physical_note: 'Après paiement, votre livre est envoyé à Lulu pour impression. Une confirmation d\'expédition arrivera à votre e-mail sous 24 heures.',

    // Duplicate modal
    duplicate_title: 'Dupliquer l\'Histoire ?',
    duplicate_msg_prefix: 'Créer une copie de',
    duplicate_cancel: 'Annuler',
    duplicate_btn: 'Dupliquer',

    // Remove scene modal
    remove_scene_title: 'Supprimer la scène ?',
    remove_scene_prefix: 'Supprimer',
    remove_scene_suffix: ' ? Cette action est irréversible.',
    remove_scene_cancel: 'Annuler',
    remove_scene_btn: 'Supprimer',

    // Credits modal
    credits_modal_title: 'Recharger les crédits d\'image',
    credits_modal_desc: 'Obtenez <strong>50 générations d\'images supplémentaires</strong> pour continuer votre histoire.',

    // Support modal
    support_modal_title: '💬 Contacter le Support',
    support_title_lbl: 'Titre',
    support_title_ph: 'Résumé bref de votre problème…',
    support_desc_lbl: 'Description',
    support_desc_ph: 'Décrivez votre problème en détail…',
    support_cancel: 'Annuler',
    support_submit: 'Envoyer au Support',
    support_success_msg: 'Votre message a été envoyé ! Nous vous répondrons bientôt.',
    support_close: 'Fermer',
    my_tickets_title: 'Mes Tickets',
  },

  // ─────────────────────────────────────────────
  es: {
    login_tagline: 'El Arte que lo Cambió Todo — Inicia sesión para continuar',
    login_btn: 'Iniciar sesión con Google',
    nav_signin: 'Iniciar sesión con Google',

    nav_origins:   'Orígenes',
    nav_top_mangas:'Top Mangas',
    nav_top_films: 'Top Películas',
    nav_my_stories:'📊 Mis Historias',
    nav_create:    '✏️ Crear',
    nav_my_mangas: '📚 Mis Libros Ilustrados',

    dropdown_profile: 'Mi Perfil',
    dropdown_signout: 'Cerrar sesión',

    hero_badge: '🎌 Desde 1814 · ¡El Cómic Japonés Que Impacta!',
    hero_subtitle: 'Desde los antiguos rollos iluminados hasta un fenómeno planetario — el manga no es solo un arte. Es un <strong>lenguaje</strong>, una <strong>filosofía</strong>, y una ventana abierta al alma de Japón.',
    hero_scroll: 'Deslizar ↓',

    origin_label: '⚡ La Historia de los Orígenes',
    origin_title: 'Cómo el Manga <span class="red">Revolucionó</span> el Mundo',
    origin_era_1: 'Siglo XII',
    origin_title_1: 'Los Primeros Rollos',
    origin_text_1: 'Todo empieza en el Japón del período Heian. El monje budista Toba Sōjō crea los <em>Chōjū-jinbutsu-giga</em> — rollos de tinta que representan animales vestidos de monjes, contando historias satíricas en imágenes secuenciales. ¡Seis siglos antes que el cómic occidental! 🐸',
    origin_era_2: 'Principios S.XIX',
    origin_title_2: 'Hokusai Inventa una Palabra',
    origin_text_2: 'En 1814, el legendario maestro del grabado <strong>Katsushika Hokusai</strong> publica sus <em>Hokusai Manga</em> — cuadernos de bocetos salvajes. Fusiona <em>man</em> (fantasioso) y <em>ga</em> (imágenes), inventando accidentalmente el nombre de un medio que conquistaría el planeta. ¡Gracias Hokusai! 🎨',
    origin_era_3: 'Post-guerra 1945',
    origin_title_3: 'Nace el Dios del Manga',
    origin_text_3: 'Tras la Segunda Guerra Mundial, <strong>Osamu Tezuka</strong> lo revoluciona todo. Inspirado por Disney y el cine, introduce escenas cinematográficas, personajes entrañables y narrativas largas. Su obra maestra <em>Shin Takarajima</em> vende 400.000 ejemplares. ¡El manga moderno ha nacido! 💥',
    origin_era_4: '1960–1980',
    origin_title_4: 'Llegan el Shōnen y el Shōjo',
    origin_text_4: 'El manga se diversifica: <em>shōnen</em> (chicos adolescentes), <em>shōjo</em> (chicas adolescentes), <em>seinen</em> (adultos). En 1968, Shueisha lanza el <em>Weekly Shōnen Jump</em>, la legendaria antología que llevaría Dragon Ball, Naruto y One Piece a los cuatro rincones del mundo. 🔥',
    origin_era_5: '1980–2000',
    origin_title_5: 'El Manga Conquista el Mundo',
    origin_text_5: 'La película <em>Akira</em> (1988) vuela las mentes occidentales. Sailor Moon, Dragon Ball Z, luego internet lanzan el manga por Europa, América, por todas partes. Una ola cultural que redefine para siempre el paisaje de la cultura pop mundial. 🌍',
    origin_era_6: 'Siglo XXI',
    origin_title_6: 'Una Industria de 15.000 M€',
    origin_text_6: 'Solo One Piece supera los <strong>530 millones de ejemplares</strong> vendidos — más que cualquier otra serie de cómic en la historia de la humanidad. Las plataformas de streaming, las editoriales internacionales y una nueva generación de creadores hacen del manga un lenguaje universal. 🚀',

    books_label: '🏆 Las Leyendas Absolutas',
    books_title: 'Top 10<br/><span class="yellow">Series</span> Manga',
    books_desc: 'Las series que definieron generaciones, pulverizaron récords de ventas y convirtieron a millones de lectores en fans de por vida. 📚',
    books_cta: 'Leer ahora →',

    data_label: '📊 Base de datos',
    data_title: 'Mis <span class="yellow">Libros Ilustrados</span>',
    data_stories: 'Historias',
    data_ai: 'Generados con IA',
    data_genres: 'Géneros distintos',
    data_search_ph: '🔍 Buscar una historia…',
    data_clear: '🗑 Borrar todo',

    movies_label: '🎬 En la Gran Pantalla',
    movies_title: 'Top 10<br/><span class="red">Películas</span> Manga',
    movies_desc: 'Las películas de animación que demostraron que el manga puede emocionar, impactar y hacer llorar tanto como cualquier película de acción real. 🎥',
    movies_cta: 'Ver →',

    creator_label: '✏️ Estudio Creativo',
    creator_title: '¡Crea tu <span class="yellow">Libro Ilustrado</span>!',
    creator_desc: '¿Tienes una idea rondando por tu cabeza? Describe tu héroe, tus escenas, tu historia — generaremos un libro ilustrado digno de los mejores editores. 🖊️',
    form_title_lbl: '📝 Título de tu historia',
    form_title_ph: 'ej. Sombra del Último Samurái, Mariposa Neón…',
    form_genre_lbl: '🎭 Género',
    form_style_lbl: '🎨 Estilo artístico',
    form_hero_lbl: '🦸 Nombre del héroe / heroína',
    form_hero_ph: 'ej. Ryō, Sakura, Jin, Akemi…',
    form_universe_lbl: '🌍 Universo y entorno',
    form_universe_ph: 'ej. Tokio distópico, reino medieval, bachillerato…',
    form_herodesc_lbl: '✨ Describe a tu héroe / heroína',
    form_herodesc_ph: 'ej. Una estudiante brillante pero solitaria que esconde un poder que aún no comprende…',
    form_photo_lbl: '📸 Foto del héroe',
    form_photo_upload: 'Haz clic para subir una foto del rostro de tu héroe',
    form_photo_hint: 'Obligatorio — ChatGPT analizará el rostro y lo reproducirá en cada ilustración generada.',
    form_photo_remove: '✕ Eliminar',
    err_hero_photo: '⚠ Se requiere una foto del héroe para generar las ilustraciones.',
    form_char2_lbl: '📸 Foto de otro personaje',
    form_premise_lbl: '💡 Tu pitch — ¡la idea de partida!',
    form_premise_ph: 'ej. Cuando su hermano es capturado por una organización secreta, ella descubre que sus pesadillas recurrentes son en realidad visiones del futuro…',
    form_premise_hint: '¡Cuantos más detalles añadas, más épico será el resultado! Describe las apuestas, giros, atmósfera…',
    err_premise: '⚠ Por favor describe tu pitch de partida.',
    form_chapters_lbl: '🎬 Escenas',
    form_add_chapter: '＋ Añadir una escena',
    err_chapters: '⚠ Por favor añade al menos una escena.',
    form_ending_lbl: '🏁 Final — ¿cómo termina?',
    form_ending_ph: 'ej. Tras derrotar a la organización, descubre que su hermano era el cerebro… pero elige perdonarle.',
    form_ending_hint: 'Describe cómo termina la historia — esto da forma a las ilustraciones generadas.',
    err_fin: '⚠ Por favor describe el final.',
    gen_btn: '🎨 ¡Generar mi Libro Ilustrado!',
    genre_options: [
      ['shonen',  'Shōnen (Acción / Aventura)'],
      ['shojo',   'Shōjo (Romance / Emociones)'],
      ['seinen',  'Seinen (Adultos / Complejo)'],
      ['isekai',  'Isekai (Otro mundo)'],
      ['horreur', 'Horror (Suspenso)'],
      ['sf',      'Ciencia ficción'],
      ['comedie', 'Comedia'],
      ['sport',   'Deporte'],
    ],
    style_options: [
      ['dynamique', 'Dinámico & explosivo'],
      ['elegant',   'Elegante & detallado'],
      ['sombre',    'Oscuro & atmosférico'],
      ['doux',      'Suave & poético'],
      ['retro',     'Retro años 90'],
      ['moderne',   'Moderno & minimalista'],
    ],

    my_mangas_label: '📚 Tu Colección',
    my_mangas_title: 'Mis <span class="red">Libros Ilustrados</span>',
    my_mangas_desc: 'Todas las historias ilustradas que has creado — pide cualquiera como volumen impreso.',

    footer_tagline: 'El Arte que Cambió el Mundo ♥ De 1814 al Infinito',

    promo_toggle: '🎟 ¿Tienes un código promocional?',
    promo_ph: 'Introduce el código',
    promo_apply: 'Aplicar',
    modal_export: '📄 Exportar PDF',
    payment_secure: 'Pago 100% seguro por',
    payment_secure2: '. Tus datos de tarjeta nunca se almacenan en este sitio.',

    profile_header_lbl: 'Cuenta',
    profile_title: 'Mi Perfil',
    profile_dropdown_item: 'Mi Perfil',
    profile_fname_lbl: 'Nombre',
    profile_lname_lbl: 'Apellido',
    profile_addr1_lbl: 'Dirección línea 1',
    profile_addr2_lbl: 'Dirección línea 2',
    profile_addr2_opt: '(opcional)',
    profile_city_lbl: 'Ciudad',
    profile_postal_lbl: 'Código Postal',
    profile_country_lbl: 'País',
    profile_save: '💾 Guardar',

    delete_title: '¿Eliminar Historia?',
    delete_msg: 'Esto eliminará permanentemente la historia y todas sus imágenes.',
    delete_cancel: 'Cancelar',
    delete_btn: 'Eliminar',

    // Manga tile buttons & badges
    tile_view:             '👁 Ver ilustraciones',
    tile_view_cover:       '📖 Ver el manga',
    tile_order_digital:    '🛒 Pedir digital',
    tile_order_physical:   '🖨️ Pedir físico',
    tile_export_pdf:       '📄 Exportar PDF',
    tile_status_ordered:   '✅ Pedido',
    tile_status_generated: '⚡ Generado',
    tile_cannot_edit:      'No se puede editar — ya pedido',
    tile_loading:          'Cargando tus historias…',

    // Login wall — tabs & buttons
    lw_tab_signin: 'Iniciar sesión',
    lw_tab_signup: 'Registrarse',
    lw_email_ph: 'Correo electrónico',
    lw_password_ph: 'Contraseña',
    lw_password_new_ph: 'Contraseña (mín. 6 caracteres)',
    lw_confirm_ph: 'Confirmar contraseña',
    lw_signin_btn: 'Iniciar sesión',
    lw_signup_btn: 'Crear cuenta',
    lw_or: 'o continuar con',

    // Data toolbar
    data_filter_all: 'Todos los géneros',

    // Creator — extra UI
    credits_left: 'créditos restantes',
    no_credits: 'Sin créditos —',
    refill_link: 'Recargar',
    save_draft: '💾 Guardar',
    form_char2_name_lbl: '👤 Nombre del personaje',
    form_char2_name_hint: '(mencionar en las escenas para incluirlo)',
    form_char2_name_ph: 'ej. Maya, Sensei Riku, Tío Kai…',
    form_bubbles_lbl: '💬 Estilo de panel',
    form_bubbles_with: 'Con bocadillos de diálogo',
    form_bubbles_without: 'Solo ilustraciones',
    form_quality_lbl: '⚡ Calidad de imagen',
    form_quality_draft: 'Borrador — más rápido y barato (~€0,01/imagen)',
    form_quality_std: 'Estándar — buena calidad (~€0,04/imagen)',
    form_quality_hi: 'Premium — mejor calidad (~€0,17/imagen)',
    loading_text: '✍️ Tu mangaka interior está despertando…',
    surprise_text: '✨ ¿Sin ideas aún? Deja que el destino decida.',
    surprise_btn: '🎲 ¡Sorpréndeme!',
    edit_cancel: '✕ Cancelar',

    // My mangas empty state
    my_mangas_empty: 'Sin historias aún — <a href="#creer">¡crea la primera!</a>',

    // Physical (Lulu) modal
    physical_subtitle: '🖨️ Impreso &amp; enviado por <strong>Lulu</strong>',
    physical_format_lbl: 'Formato',
    physical_binding_lbl: 'Encuadernación',
    physical_interior_lbl: 'Interior',
    physical_pages_lbl: 'Páginas',
    physical_fulfillment_lbl: 'Impresión',
    physical_fulfillment_val: 'Impresión bajo demanda Lulu',
    physical_delivery_lbl: 'Entrega',
    physical_delivery_val: '7–14 días hábiles',
    physical_price_loading: 'Obteniendo precio de Lulu…',
    physical_print_cost: 'Coste de impresión (Lulu)',
    physical_shipping_title: '📦 Dirección de envío',
    physical_firstname_ph: 'Nombre',
    physical_lastname_ph: 'Apellido',
    physical_addr1_ph: 'Dirección línea 1',
    physical_addr2_ph: 'Dirección línea 2 (opcional)',
    physical_city_ph: 'Ciudad',
    physical_postal_ph: 'Código postal',
    physical_state_ph: 'Estado / Provincia',
    physical_note: 'Tras el pago, tu libro se envía a Lulu para impresión. Una confirmación de envío llegará a tu correo en 24 horas.',

    // Duplicate modal
    duplicate_title: '¿Duplicar Historia?',
    duplicate_msg_prefix: 'Crear una copia de',
    duplicate_cancel: 'Cancelar',
    duplicate_btn: 'Duplicar',

    // Remove scene modal
    remove_scene_title: '¿Eliminar escena?',
    remove_scene_prefix: 'Eliminar',
    remove_scene_suffix: '? Esta acción no se puede deshacer.',
    remove_scene_cancel: 'Cancelar',
    remove_scene_btn: 'Eliminar',

    // Credits modal
    credits_modal_title: 'Recargar créditos de imagen',
    credits_modal_desc: 'Obtén <strong>50 generaciones de imagen más</strong> para seguir creando tu historia.',

    // Support modal
    support_modal_title: '💬 Contactar Soporte',
    support_title_lbl: 'Título',
    support_title_ph: 'Resumen breve de tu problema…',
    support_desc_lbl: 'Descripción',
    support_desc_ph: 'Describe tu problema en detalle…',
    support_cancel: 'Cancelar',
    support_submit: 'Enviar al Soporte',
    support_success_msg: '¡Tu mensaje ha sido enviado! Te responderemos pronto.',
    support_close: 'Cerrar',
    my_tickets_title: 'Mis Tickets',
  },
};

function getLang() {
  return localStorage.getItem('lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  location.reload();
}

function t(key) {
  const T = TRANSLATIONS[getLang()] || TRANSLATIONS.en;
  return T[key] !== undefined ? T[key] : (TRANSLATIONS.en[key] || key);
}

function applyTranslations() {
  const lang = getLang();
  const T = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.documentElement.lang = lang;

  const set = (selector, key, all) => {
    const els = all ? document.querySelectorAll(selector) : [document.querySelector(selector)];
    els.forEach(el => {
      if (!el || T[key] === undefined) return;
      const val = String(T[key]);
      if (val.includes('<')) el.innerHTML = val;
      else el.textContent = val;
    });
  };
  const ph = (id, key) => {
    const el = document.getElementById(id);
    if (el && T[key]) el.placeholder = T[key];
  };

  // Login wall
  set('.lw-tagline', 'login_tagline');
  document.querySelectorAll('.lw-google-btn, .btn-google-signin').forEach(btn => {
    const svg = btn.querySelector('svg');
    if (T.login_btn) btn.childNodes[btn.childNodes.length - 1].textContent = ' ' + T.login_btn;
  });

  // Nav
  const navLinks = document.querySelectorAll('.nav-links li a');
  const navKeys  = ['nav_origins','nav_top_mangas','nav_top_films','nav_my_stories','nav_create','nav_my_mangas'];
  navLinks.forEach((a, i) => { if (navKeys[i] && T[navKeys[i]]) a.textContent = T[navKeys[i]]; });

  // User dropdown
  const profileItem = document.querySelector('.profile-item');
  if (profileItem) profileItem.childNodes[profileItem.childNodes.length - 1].textContent = ' ' + (T.dropdown_profile || '');
  const signoutItem = document.querySelector('.signout-item');
  if (signoutItem) signoutItem.childNodes[signoutItem.childNodes.length - 1].textContent = ' ' + (T.dropdown_signout || '');

  // Hero
  set('.hero-badge', 'hero_badge');
  set('.hero-subtitle', 'hero_subtitle');
  const heroScroll = document.querySelector('.hero-scroll span');
  if (heroScroll && T.hero_scroll) heroScroll.textContent = T.hero_scroll;

  // Origin
  set('#origin .section-label', 'origin_label');
  set('#origin .section-title', 'origin_title');
  const panels = document.querySelectorAll('#origin .story-panel');
  [1,2,3,4,5,6].forEach((n, i) => {
    const p = panels[i]; if (!p) return;
    const era   = p.querySelector('.panel-era');
    const title = p.querySelector('.panel-title');
    const text  = p.querySelector('.panel-text');
    if (era   && T[`origin_era_${n}`])   era.textContent   = T[`origin_era_${n}`];
    if (title && T[`origin_title_${n}`]) title.textContent = T[`origin_title_${n}`];
    if (text  && T[`origin_text_${n}`])  text.innerHTML    = T[`origin_text_${n}`];
  });

  // Top manga books
  set('#manga-books .section-label', 'books_label');
  set('#manga-books .section-title', 'books_title');
  set('#manga-books .section-desc', 'books_desc');
  document.querySelectorAll('#books-grid .overlay-cta').forEach(el => { if (T.books_cta) el.textContent = T.books_cta; });

  // Mes mangas / data
  set('#mes-mangas .section-label', 'data_label');
  set('#mes-mangas .section-title', 'data_title');
  const statLbls = document.querySelectorAll('#data-stats .data-stat-lbl');
  if (statLbls[0] && T.data_stories) statLbls[0].textContent = T.data_stories;
  if (statLbls[1] && T.data_ai)      statLbls[1].textContent = T.data_ai;
  if (statLbls[2] && T.data_genres)  statLbls[2].textContent = T.data_genres;
  ph('data-search', 'data_search_ph');
  const clearBtn = document.querySelector('.data-clear-btn');
  if (clearBtn && T.data_clear) clearBtn.textContent = T.data_clear;

  // Top movies
  set('#manga-movies .section-label', 'movies_label');
  set('#manga-movies .section-title', 'movies_title');
  set('#manga-movies .section-desc', 'movies_desc');
  document.querySelectorAll('#movies-grid .overlay-cta').forEach(el => { if (T.movies_cta) el.textContent = T.movies_cta; });

  // Creator
  set('#creer .section-label', 'creator_label');
  set('#creer .section-title', 'creator_title');
  set('#creer .section-desc', 'creator_desc');
  set('label[for="f-titre"]',    'form_title_lbl');
  set('label[for="f-genre"]',    'form_genre_lbl');
  set('label[for="f-style"]',    'form_style_lbl');
  set('label[for="f-heros"]',    'form_hero_lbl');
  set('label[for="f-univers"]',  'form_universe_lbl');
  set('label[for="f-hero-desc"]','form_herodesc_lbl');
  set('label[for="f-premise"]',  'form_premise_lbl');
  set('label[for="f-fin"]',      'form_ending_lbl');
  ph('f-titre',    'form_title_ph');
  ph('f-heros',    'form_hero_ph');
  ph('f-univers',  'form_universe_ph');
  ph('f-hero-desc','form_herodesc_ph');
  ph('f-premise',  'form_premise_ph');
  ph('f-fin',      'form_ending_ph');

  // Photo upload — hero
  const heroPhotoLabel = document.getElementById('hero-photo-label');
  if (heroPhotoLabel && T.form_photo_lbl) {
    const star = heroPhotoLabel.querySelector('span');
    heroPhotoLabel.textContent = T.form_photo_lbl + ' ';
    if (star) heroPhotoLabel.appendChild(star);
  }
  const uploadSpan = document.querySelector('#hero-upload-label span:last-child');
  if (uploadSpan && T.form_photo_upload) uploadSpan.textContent = T.form_photo_upload;
  const photoHint = document.querySelector('#hero-upload-area ~ .form-hint, #hero-upload-area + .form-hint');
  if (photoHint && T.form_photo_hint) photoHint.textContent = T.form_photo_hint;
  document.querySelectorAll('.hero-upload-clear').forEach((btn, i) => {
    if (i === 0 && T.form_photo_remove) btn.textContent = T.form_photo_remove;
  });
  set('#err-hero-photo', 'err_hero_photo');

  // Photo upload — second character
  const char2Label = document.getElementById('char2-photo-label');
  if (char2Label && T.form_char2_lbl) {
    const small = char2Label.querySelector('small');
    char2Label.textContent = T.form_char2_lbl + ' ';
    if (small) char2Label.appendChild(small);
  }

  // Form hints & errors
  const hints = document.querySelectorAll('#creer .form-hint');
  // premise hint (2nd hint), ending hint (3rd hint)
  if (hints[1] && T.form_premise_hint) hints[1].textContent = T.form_premise_hint;
  if (hints[2] && T.form_ending_hint)  hints[2].textContent = T.form_ending_hint;
  set('#err-premise',  'err_premise');
  set('#err-chapters', 'err_chapters');
  set('#err-fin',      'err_fin');

  // Chapters label & button
  const chapLabel = document.querySelector('.chapters-header .form-label');
  if (chapLabel && T.form_chapters_lbl) {
    const countSpan = chapLabel.querySelector('.chapter-count');
    chapLabel.textContent = T.form_chapters_lbl + ' ';
    if (countSpan) chapLabel.appendChild(countSpan);
  }
  const addChBtn = document.getElementById('add-chapter-btn');
  if (addChBtn && T.form_add_chapter) addChBtn.textContent = T.form_add_chapter;

  // Generate button
  const genBtn = document.getElementById('gen-btn');
  if (genBtn && T.gen_btn) genBtn.textContent = T.gen_btn;

  // Select options
  const genreSelect = document.getElementById('f-genre');
  if (genreSelect && T.genre_options) {
    const cur = genreSelect.value;
    genreSelect.innerHTML = T.genre_options.map(([v,l]) => `<option value="${v}">${l}</option>`).join('');
    genreSelect.value = cur;
  }
  // My Mangas section
  set('#my-mangas .section-label', 'my_mangas_label');
  set('#my-mangas .section-title', 'my_mangas_title');
  set('#my-mangas .section-desc',  'my_mangas_desc');

  // Footer
  set('.footer-tagline', 'footer_tagline');

  // Payment modal
  const promoToggle = document.getElementById('promo-toggle');
  if (promoToggle && T.promo_toggle) promoToggle.textContent = T.promo_toggle;
  ph('promo-code-input', 'promo_ph');
  const promoApply = document.getElementById('promo-apply-btn');
  if (promoApply && T.promo_apply) promoApply.textContent = T.promo_apply;
  const exportBtn = document.getElementById('modal-export-btn');
  if (exportBtn && T.modal_export) exportBtn.textContent = T.modal_export;

  // Profile modal
  set('#profile-modal .payment-header-label', 'profile_header_lbl');
  set('#profile-modal .payment-header h3',    'profile_title');
  set('label[for="p-firstname"]', 'profile_fname_lbl');
  set('label[for="p-lastname"]',  'profile_lname_lbl');
  set('label[for="p-addr1"]',     'profile_addr1_lbl');
  set('label[for="p-city"]',      'profile_city_lbl');
  set('label[for="p-postal"]',    'profile_postal_lbl');
  set('label[for="p-country"]',   'profile_country_lbl');
  const addr2Label = document.querySelector('label[for="p-addr2"]');
  if (addr2Label && T.profile_addr2_lbl) {
    const optSpan = addr2Label.querySelector('.profile-optional');
    addr2Label.textContent = T.profile_addr2_lbl + ' ';
    if (optSpan) { optSpan.textContent = T.profile_addr2_opt || '(optional)'; addr2Label.appendChild(optSpan); }
  }
  const profileSaveBtn = document.getElementById('profile-save-btn');
  if (profileSaveBtn && T.profile_save) profileSaveBtn.textContent = T.profile_save;

  // Delete modal
  set('.delete-confirm-title', 'delete_title');
  const deleteMsgEl = document.querySelector('.delete-confirm-msg');
  if (deleteMsgEl && T.delete_msg) {
    const strong = deleteMsgEl.querySelector('strong');
    const nameText = strong ? strong.textContent : '';
    deleteMsgEl.innerHTML = `<strong id="delete-confirm-name">${nameText}</strong> — ${T.delete_msg}`;
  }
  set('#delete-modal .delete-confirm-actions .action-btn:first-child', 'delete_cancel');
  const deleteBtn = document.getElementById('delete-confirm-btn');
  if (deleteBtn && T.delete_btn) deleteBtn.textContent = T.delete_btn;

  // ── Login wall ────────────────────────────────────────
  const lwTabSignin = document.getElementById('lw-tab-signin');
  if (lwTabSignin && T.lw_tab_signin) lwTabSignin.textContent = T.lw_tab_signin;
  const lwTabSignup = document.getElementById('lw-tab-signup');
  if (lwTabSignup && T.lw_tab_signup) lwTabSignup.textContent = T.lw_tab_signup;
  ph('lw-email',        'lw_email_ph');
  ph('lw-password',     'lw_password_ph');
  ph('lw-reg-email',    'lw_email_ph');
  ph('lw-reg-password', 'lw_password_new_ph');
  ph('lw-reg-confirm',  'lw_confirm_ph');
  const lwSigninBtn = document.getElementById('lw-signin-btn');
  if (lwSigninBtn && T.lw_signin_btn) lwSigninBtn.textContent = T.lw_signin_btn;
  const lwSignupBtn = document.getElementById('lw-signup-btn');
  if (lwSignupBtn && T.lw_signup_btn) lwSignupBtn.textContent = T.lw_signup_btn;
  const lwDividerSpan = document.querySelector('.lw-divider span');
  if (lwDividerSpan && T.lw_or) lwDividerSpan.textContent = T.lw_or;

  // ── Data filter ──────────────────────────────────────
  const dataFilterAllOpt = document.querySelector('#data-filter option[value=""]');
  if (dataFilterAllOpt && T.data_filter_all) dataFilterAllOpt.textContent = T.data_filter_all;

  // ── Creator extras ───────────────────────────────────
  // Credits badge "N credits left"
  const creditsBadge = document.getElementById('credits-badge');
  const creditsCount = document.getElementById('credits-count');
  if (creditsBadge && creditsCount && T.credits_left) {
    const n = creditsCount.textContent;
    creditsBadge.innerHTML = `<span id="credits-count">${n}</span> ${T.credits_left}`;
  }
  const creditsBadgeSave = document.getElementById('credits-badge-save');
  const creditsCountSave = document.getElementById('credits-count-save');
  if (creditsBadgeSave && creditsCountSave && T.credits_left) {
    const n = creditsCountSave.textContent;
    creditsBadgeSave.innerHTML = `<span id="credits-count-save">${n}</span> ${T.credits_left}`;
  }
  // "No credits left — Refill credits"
  const noCreditsSpan = document.querySelector('#credit-refill-prompt > span');
  if (noCreditsSpan && T.no_credits) noCreditsSpan.textContent = T.no_credits;
  const refillLinkEl = document.querySelector('#credit-refill-prompt .refill-link');
  if (refillLinkEl && T.refill_link) refillLinkEl.textContent = T.refill_link;
  // Save draft button
  const saveDraftBtn = document.getElementById('save-draft-btn');
  if (saveDraftBtn && T.save_draft) saveDraftBtn.textContent = T.save_draft;
  // Second character name label + hint + placeholder
  const char2NameLabel = document.querySelector('label[for="f-char2-name"]');
  if (char2NameLabel && T.form_char2_name_lbl) {
    const small = char2NameLabel.querySelector('small');
    char2NameLabel.textContent = T.form_char2_name_lbl + ' ';
    if (small) { small.textContent = T.form_char2_name_hint || small.textContent; char2NameLabel.appendChild(small); }
  }
  ph('f-char2-name', 'form_char2_name_ph');
  // Panel style select
  set('label[for="f-bubbles"]', 'form_bubbles_lbl');
  const bubblesSelect = document.getElementById('f-bubbles');
  if (bubblesSelect) {
    if (bubblesSelect.options[0] && T.form_bubbles_with)    bubblesSelect.options[0].textContent = T.form_bubbles_with;
    if (bubblesSelect.options[1] && T.form_bubbles_without) bubblesSelect.options[1].textContent = T.form_bubbles_without;
  }
  // Image quality select
  set('label[for="f-img-quality"]', 'form_quality_lbl');
  const qualitySelect = document.getElementById('f-img-quality');
  if (qualitySelect) {
    if (qualitySelect.options[0] && T.form_quality_draft) qualitySelect.options[0].textContent = T.form_quality_draft;
    if (qualitySelect.options[1] && T.form_quality_std)   qualitySelect.options[1].textContent = T.form_quality_std;
    if (qualitySelect.options[2] && T.form_quality_hi)    qualitySelect.options[2].textContent = T.form_quality_hi;
  }
  // Loading message
  const loadingMsg = document.getElementById('loading-msg');
  if (loadingMsg && T.loading_text) loadingMsg.textContent = T.loading_text;
  // Surprise bar
  const surpriseTextEl = document.querySelector('.surprise-bar-text');
  if (surpriseTextEl && T.surprise_text) surpriseTextEl.textContent = T.surprise_text;
  const surpriseBtnEl = document.querySelector('.surprise-btn');
  if (surpriseBtnEl && T.surprise_btn) surpriseBtnEl.textContent = T.surprise_btn;
  // Edit mode cancel
  const editCancelBtn = document.querySelector('.edit-cancel-btn');
  if (editCancelBtn && T.edit_cancel) editCancelBtn.textContent = T.edit_cancel;

  // ── My mangas empty state ────────────────────────────
  const myMangasEmptyP = document.querySelector('#my-mangas-empty p');
  if (myMangasEmptyP && T.my_mangas_empty) myMangasEmptyP.innerHTML = T.my_mangas_empty;

  // ── Physical (Lulu) modal ────────────────────────────
  const physSubtitle = document.querySelector('.physical-subtitle');
  if (physSubtitle && T.physical_subtitle) physSubtitle.innerHTML = T.physical_subtitle;
  // Spec row labels
  const specRowLabels = document.querySelectorAll('.physical-spec-row span:first-child');
  const specLabelKeys = ['physical_format_lbl','physical_binding_lbl','physical_interior_lbl','physical_pages_lbl','physical_fulfillment_lbl','physical_delivery_lbl'];
  specRowLabels.forEach((el, i) => { if (T[specLabelKeys[i]]) el.textContent = T[specLabelKeys[i]]; });
  // Spec row values (fulfillment=4, delivery=5)
  const specRowVals = document.querySelectorAll('.physical-spec-row span:last-child');
  if (specRowVals[4] && T.physical_fulfillment_val) specRowVals[4].textContent = T.physical_fulfillment_val;
  if (specRowVals[5] && T.physical_delivery_val)    specRowVals[5].textContent = T.physical_delivery_val;
  // Price loading label
  const priceLodingEl = document.querySelector('.physical-price-loading');
  if (priceLodingEl && T.physical_price_loading) {
    const spinner = priceLodingEl.querySelector('.spinner-small');
    priceLodingEl.textContent = ' ' + T.physical_price_loading;
    if (spinner) priceLodingEl.insertBefore(spinner, priceLodingEl.firstChild);
  }
  const printCostLbl = document.querySelector('.physical-price-label');
  if (printCostLbl && T.physical_print_cost) printCostLbl.textContent = T.physical_print_cost;
  // Shipping section
  const physShippingTitle = document.querySelector('.physical-section-title');
  if (physShippingTitle && T.physical_shipping_title) physShippingTitle.textContent = T.physical_shipping_title;
  ph('ps-firstname', 'physical_firstname_ph');
  ph('ps-lastname',  'physical_lastname_ph');
  ph('ps-addr1',     'physical_addr1_ph');
  ph('ps-addr2',     'physical_addr2_ph');
  ph('ps-city',      'physical_city_ph');
  ph('ps-postal',    'physical_postal_ph');
  ph('ps-state',     'physical_state_ph');
  const physNoteEl = document.querySelector('.physical-note');
  if (physNoteEl && T.physical_note) physNoteEl.textContent = T.physical_note;

  // ── Duplicate modal ──────────────────────────────────
  set('#duplicate-modal .delete-confirm-title', 'duplicate_title');
  const dupMsgEl = document.querySelector('#duplicate-modal .delete-confirm-msg');
  if (dupMsgEl && T.duplicate_msg_prefix) {
    const strong = dupMsgEl.querySelector('strong');
    const name = strong ? strong.textContent : '';
    dupMsgEl.innerHTML = `${T.duplicate_msg_prefix} <strong id="duplicate-confirm-name">${name}</strong>?`;
  }
  const dupCancelBtn = document.querySelector('#duplicate-modal .delete-confirm-actions .action-btn:first-child');
  if (dupCancelBtn && T.duplicate_cancel) dupCancelBtn.textContent = T.duplicate_cancel;
  const dupConfirmBtn = document.getElementById('duplicate-confirm-btn');
  if (dupConfirmBtn && T.duplicate_btn) dupConfirmBtn.textContent = T.duplicate_btn;

  // ── Remove scene modal ───────────────────────────────
  set('#remove-scene-modal .delete-confirm-title', 'remove_scene_title');
  const removeSceneMsgEl = document.querySelector('#remove-scene-modal .delete-confirm-msg');
  if (removeSceneMsgEl) {
    const strong = removeSceneMsgEl.querySelector('strong');
    const label = strong ? strong.textContent : '';
    const prefix = T.remove_scene_prefix || 'Remove';
    const suffix = T.remove_scene_suffix || '? This cannot be undone.';
    removeSceneMsgEl.innerHTML = `${prefix} <strong id="remove-scene-label">${label}</strong>${suffix}`;
  }
  const removeSceneCancelBtn = document.querySelector('#remove-scene-modal .delete-confirm-actions .action-btn:first-child');
  if (removeSceneCancelBtn && T.remove_scene_cancel) removeSceneCancelBtn.textContent = T.remove_scene_cancel;
  const removeSceneActionBtn = document.querySelector('#remove-scene-modal .delete-confirm-actions .action-btn:last-child');
  if (removeSceneActionBtn && T.remove_scene_btn) removeSceneActionBtn.textContent = T.remove_scene_btn;

  // ── Credits modal ─────────────────────────────────────
  const creditsModalTitle = document.querySelector('.credits-modal-title');
  if (creditsModalTitle && T.credits_modal_title) creditsModalTitle.textContent = T.credits_modal_title;
  const creditsModalDesc = document.querySelector('.credits-modal-desc');
  if (creditsModalDesc && T.credits_modal_desc) creditsModalDesc.innerHTML = T.credits_modal_desc;

  // ── Support modal ─────────────────────────────────────
  set('.support-modal-title', 'support_modal_title');
  const supportFormLabels = document.querySelectorAll('#support-form .support-label');
  if (supportFormLabels[0] && T.support_title_lbl) supportFormLabels[0].textContent = T.support_title_lbl;
  if (supportFormLabels[1] && T.support_desc_lbl)  supportFormLabels[1].textContent = T.support_desc_lbl;
  ph('support-title-input', 'support_title_ph');
  ph('support-desc-input',  'support_desc_ph');
  const supportCancelBtn = document.querySelector('.support-cancel-btn');
  if (supportCancelBtn && T.support_cancel) supportCancelBtn.textContent = T.support_cancel;
  const supportSubmitBtn = document.getElementById('support-submit-btn');
  if (supportSubmitBtn && T.support_submit) supportSubmitBtn.textContent = T.support_submit;
  const supportSuccessP = document.querySelector('#support-success p');
  if (supportSuccessP && T.support_success_msg) supportSuccessP.textContent = T.support_success_msg;
  const supportCloseBtn = document.querySelector('#support-success .support-submit-btn');
  if (supportCloseBtn && T.support_close) supportCloseBtn.textContent = T.support_close;
  set('.my-tickets-title', 'my_tickets_title');

  // ── Active flag ───────────────────────────────────────
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.addEventListener('DOMContentLoaded', applyTranslations);
