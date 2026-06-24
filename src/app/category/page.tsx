import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ClientWrapper from './ClientWrapper';

export const dynamic = 'force-dynamic';

const SECTOR_METADATA: Record<string, {
  title: { fr: string; ar: string };
  description: { fr: string; ar: string };
  keywords: string;
}> = {
  BTPH: {
    title: {
      fr: "BTPH (Bâtiment, Travaux Publics et Hydrauliques) | MazadClick",
      ar: "البناء والأشغال العمومية (BTPH) | مزاد كليك"
    },
    description: {
      fr: "Trouvez des chantiers BTP, des appels d'offres BTP, du matériel de chantier et des opportunités d'infrastructure en Algérie. بنيان، صوالح الشونتي.",
      ar: "ابحث عن مشاريع البناء، مناقصات البناء، معدات وآليات الأشغال، وفرص البنية التحتية في الجزائر. بنيان وصوالح الشونتي."
    },
    keywords: "Société de Bâtiment Travaux Publics et Hydrauliques, البناء والأشغال العمومية, BTPH, chantiers BTP, marché BTP professionnel, appels d'offres BTP, matériel de chantier, بنيان, صوالح الشونتي, خدامين ومقاولين, دفوار شارج"
  },
  INDUSTRIE: {
    title: {
      fr: "Équipements Industriels & Usines B2B Algérie | MazadClick",
      ar: "الصناعة والمعدات والإنتاج الصناعي | مزاد كليك"
    },
    description: {
      fr: "Achetez et vendez vos machines industrielles, pièces de rechange, et solutions de maintenance en Algérie. الصيانة صناعية.",
      ar: "شراء وبيع الآلات الصناعية، الصيانة الصناعية، قطع الغيار وحلول الإنتاج في الجزائر."
    },
    keywords: "équipements industriels, usine, production industrielle, achats industriels, machines industrielles, الصيانة الصناعية, ماشينات تاع زين, صيانة صناعية, قطع الغيار"
  },
  AGRICULTURE: {
    title: {
      fr: "Matériel Agricole & Agro-industrie Algérie | MazadClick",
      ar: "الفلاحة والعتاد الفلاحي وجني المحاصيل | مزاد كليك"
    },
    description: {
      fr: "Marché agricole professionnel en Algérie: vente de récoltes, tracteurs, matériel agricole et solutions B2B. دوزان الفلاحة.",
      ar: "السوق الزراعي المهني في الجزائر: بيع المحاصيل، العتاد الفلاحي، الموردين والمشاريع الزراعية."
    },
    keywords: "matériel agricole, agro-industrie, marché agricole, récolte, فلاحة, ماتريال تاع حرث, بيع المحصول, حصيدة, دوزان الفلاحة"
  },
  RECYCLAGE: {
    title: {
      fr: "Recyclage Professionnel & Économie Circulaire | MazadClick",
      ar: "رسكلة النفايات والاقتصاد الأخضر | مزاد كليك"
    },
    description: {
      fr: "Solutions écologiques B2B en Algérie. Gestion, traitement, valorisation des déchets plastique, ferraille et récupération.",
      ar: "إعادة التدوير وتسيير النفايات والاقتصاد الدائري للشركات في الجزائر. تثمين البلاستيك والحديد والريكوبي."
    },
    keywords: "recyclage professionnel, économie circulaire, gestion des déchets, valorisation plastique, ferraille, رسكلة, صوالح الريكوبي, تسيير الزبل"
  },
  COMMERCE: {
    title: {
      fr: "Vente en Gros & Import-Export B2B Algérie | MazadClick",
      ar: "تجارة الجملة والتبادل التجاري بين الشركات | مزاد كليك"
    },
    description: {
      fr: "Échanges commerciaux, vente en gros, distribution B2B et import-export en Algérie. Sourcing fournisseurs, سوق الحميز.",
      ar: "الصفقات التجارية، البيع بالجملة، الاستيراد والتصدير في الجزائر. موردون مهنيون بين الشركات وسوق الحميز."
    },
    keywords: "vente en gros, import-export, transactions commerciales, distribution B2B, بيع بالجملة, ڤرو, لابورتاسيون, سوق الحميز"
  },
  ARTISANAT: {
    title: {
      fr: "Artisanat Professionnel & Sourcing Local | MazadClick",
      ar: "الصناعة التقليدية والحرف المهنية | مزاد كليك"
    },
    description: {
      fr: "Commandes professionnelles d'artisanat local et sourcing d'artisans qualifiés en Algérie. برودوي تاع لبلاد.",
      ar: "طلبات الشركات من الحرفيين، بيع المنتجات الحرفية والصناعات التقليدية المحلية في الجزائر. برودوي تاع لبلاد."
    },
    keywords: "artisanat professionnel, sourcing local, artisans qualifiés, صناعة تقليدية, حرفيين, برودوي تاع لبلاد"
  },
  SERVICES: {
    title: {
      fr: "Solutions B2B & Services aux Entreprises | MazadClick",
      ar: "خدمات الشركات والحلول الرقمية | مزاد كليك"
    },
    description: {
      fr: "Conseil, stratégie commerciale, communication, fournitures et outils digitaux professionnels en Algérie.",
      ar: "تطوير الأعمال، الحلول الرقمية للشركات، مرافقة وإرشاد المؤسسات، والتسويق الرقمي."
    },
    keywords: "solutions B2B, services aux entreprises, conseil, communication, branding, سيرفيس تاع شركات, بيبليسيتي, كونساي"
  },
  LOGISTIQUE: {
    title: {
      fr: "Transport, Logistique & Fret B2B Algérie | MazadClick",
      ar: "النقل واللوجستيك وتوصيل البضائع | مزاد كليك"
    },
    description: {
      fr: "Solutions logistiques, transport de marchandises national et international, et livraison 58 wilayas.",
      ar: "النقل واللوجستيك وتوصيل البضائع لـ 58 ولاية، شحن السلع وإدارة سلسلة التوريد."
    },
    keywords: "logistique B2B, transport fret, transport marchandises, chaîne d'approvisionnement, طغونسفور, توصيل 58 ولاية, شحن السلعة"
  }
};

export async function generateMetadata(props: {
  searchParams: Promise<{ category?: string; name?: string; lng?: string }>
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const categoryName = searchParams.name ? decodeURIComponent(searchParams.name) : '';
  
  const cookieStore = await cookies();
  const lng = searchParams.lng || cookieStore.get('i18nextLng')?.value || 'fr';
  const isArabic = lng === 'ar';

  // Fallback default
  let title = isArabic
    ? "تصفح الفئات والمجالات | مزاد كليك"
    : "Catégories & Secteurs d'Activités B2B | MazadClick";
    
  let description = isArabic
    ? "تصفح فئات ومجالات النشاط التجاري للمناقصات والمزادات والبيع المباشر في الجزائر."
    : "Parcourez les catégories et secteurs d'activités pour les appels d'offres, enchères et ventes directes en Algérie.";
    
  let keywords = isArabic
    ? "قطاعات المناقصات, مناقصات البناء, خدمات, تكنولوجيا, قطاعات النشاط"
    : "Secteurs d'activités, marchés publics, bâtiment, services, IT, appels d'offres par domaine";

  if (categoryName) {
    const normName = categoryName.toUpperCase().trim();
    
    // Check if categoryName matches one of our 8 target sectors
    let matchedSector: string | null = null;
    if (normName.includes('BTP') || normName.includes('CONSTRUCTION') || normName.includes('بناء') || normName.includes('أشغال')) {
      matchedSector = 'BTPH';
    } else if (normName.includes('INDUSTRI') || normName.includes('صناعة') || normName.includes('عجتاد')) {
      matchedSector = 'INDUSTRIE';
    } else if (normName.includes('AGRICULT') || normName.includes('فلاحة') || normName.includes('زراعة') || normName.includes('حرث')) {
      matchedSector = 'AGRICULTURE';
    } else if (normName.includes('RECYCL') || normName.includes('رسكلة') || normName.includes('تدوير')) {
      matchedSector = 'RECYCLAGE';
    } else if (normName.includes('COMMERC') || normName.includes('تجارة') || normName.includes('جملة') || normName.includes('GROS')) {
      matchedSector = 'COMMERCE';
    } else if (normName.includes('ARTISAN') || normName.includes('حرف') || normName.includes('تقليدي')) {
      matchedSector = 'ARTISANAT';
    } else if (normName.includes('SERVICE') || normName.includes('خدمات') || normName.includes('CONSEIL')) {
      matchedSector = 'SERVICES';
    } else if (normName.includes('TRANSPORT') || normName.includes('LOGISTI') || normName.includes('نقل') || normName.includes('لوجستيك') || normName.includes('شحن')) {
      matchedSector = 'LOGISTIQUE';
    }

    if (matchedSector && SECTOR_METADATA[matchedSector]) {
      const sectorData = SECTOR_METADATA[matchedSector];
      title = isArabic ? sectorData.title.ar : sectorData.title.fr;
      description = isArabic ? sectorData.description.ar : sectorData.description.fr;
      keywords = sectorData.keywords;
    } else {
      // General dynamic mapping if it's a dynamic category not directly in the 8 static ones
      title = isArabic 
        ? `${categoryName} - مناقصات ومزادات B2B | مزاد كليك`
        : `${categoryName} - Appels d'offres & Enchères B2B | MazadClick`;
      description = isArabic
        ? `تصفح عروض ومناقصات ومزادات قطاع ${categoryName} في الجزائر.`
        : `Consultez les appels d'offres, enchères et ventes directes pour le secteur ${categoryName} en Algérie.`;
      keywords = `MazadClick, B2B Algérie, ${categoryName}, marchés ${categoryName}`;
    }
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      locale: isArabic ? 'ar_DZ' : 'fr_DZ',
    }
  };
}

export default function CategoryPage() {
  return <ClientWrapper />;
}


