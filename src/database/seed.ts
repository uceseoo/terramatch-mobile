import { getDatabase, isDatabaseSeeded } from './db';

interface SeedProject {
  name: string;
  organization: string;
  landscape: 'Greater Rift Valley' | 'Lake Kivu & Rusizi' | 'Ghana Cocoa Belt';
  sites: string[];
}

// Complete dataset: 90 projects across 3 landscapes with all sites
// Sourced from v3 prototype + CSV data files
const SEED_DATA: SeedProject[] = [
  // ═══ Ghana Cocoa Belt (10 projects) ═══
  { name: 'A Rocha Ghana', organization: 'A Rocha Ghana', landscape: 'Ghana Cocoa Belt', sites: ['Abuakwa South Municipality', 'Atewa Forest', 'Atiwa West District', 'Ayensuano District', 'Degraded Mine Site'] },
  { name: 'Emfed Farms', organization: 'Emfed Farms and Trading Company Limited', landscape: 'Ghana Cocoa Belt', sites: ['Beposo Site', 'Foso Site'] },
  { name: 'Fanteakwa CCP', organization: 'Fanteakwa District CCP Cooperative Cocoa Farmers and Marketing Limited', landscape: 'Ghana Cocoa Belt', sites: ['Abuakwa South District Site', 'Atiwa East District Site', 'Fanteakwa North District Site', 'Fanteakwa South District Site'] },
  { name: 'Hen Mpoano', organization: 'Hen Mpoano (Our Coast)', landscape: 'Ghana Cocoa Belt', sites: ['Ankobra'] },
  { name: 'Herp-Ghana', organization: 'Herp-Ghana', landscape: 'Ghana Cocoa Belt', sites: ['Akrobi Site', 'Badu Site', 'Nsawkaw Site'] },
  { name: 'INEC Ghana', organization: 'INSTITUTE OF NATURE AND ENVIRONMENTAL CONSERVATION (INEC GHANA)', landscape: 'Ghana Cocoa Belt', sites: ['Mankrang'] },
  { name: 'Kukuom Cooperative', organization: 'Kukuom Cooperative Cocoa Farmers and Marketing Union Limited', landscape: 'Ghana Cocoa Belt', sites: ['Kukuom Cooperative'] },
  { name: 'Sakam Savana', organization: 'Sakam Savana Limited', landscape: 'Ghana Cocoa Belt', sites: ['Afram Compartment 69 Site'] },
  { name: 'Solidaridad', organization: 'Solidaridad Eastern and Central Africa Expertise Centre', landscape: 'Ghana Cocoa Belt', sites: ['WERU WARD', 'CHARAGITA WARD', 'KIRIITA WARD'] },
  { name: 'Tropenbos Ghana', organization: 'Tropenbos Ghana Programme', landscape: 'Ghana Cocoa Belt', sites: ['Bankame Site', 'Dome River FR Site', 'Prakaw Forest Reserve Site'] },

  // ═══ Greater Rift Valley (45 projects) ═══
  { name: 'Ahadi Achievers CBO', organization: 'Ahadi Achievers Empowerment CBO', landscape: 'Greater Rift Valley', sites: ['Ngiluni Location Village Ecosystem'] },
  { name: 'BirdLife Kenya', organization: 'BirdLife International - Kenya', landscape: 'Greater Rift Valley', sites: ['RWAMBOGO_MURWA'] },
  { name: 'DREK', organization: 'DEVELOPMENT RESPONSE-KENYA (DREK)', landscape: 'Greater Rift Valley', sites: ['NDARAGWA FOREST PESI SITE A', 'NDARAGWA FOREST PESI SITE B', 'NDARAGWA FOREST PESI SITE C'] },
  { name: 'Eden Reforestation', organization: 'Eden Reforestation Projects', landscape: 'Greater Rift Valley', sites: ['Ol Mariko Restoration Project in Mau'] },
  { name: 'ENDAO WRUA', organization: 'ENDAO WATER RESOURCE USERS ASSOCIATION', landscape: 'Greater Rift Valley', sites: ['Kirdam'] },
  { name: 'EAF', organization: 'Environment and Agroforestry Foundation (EAF)', landscape: 'Greater Rift Valley', sites: ['Oforikrom Restoration Area'] },
  { name: 'Farmlife Health', organization: 'Farmlife Health Services', landscape: 'Greater Rift Valley', sites: ['KURESOI', 'MAUCHE NJORO'] },
  { name: 'FESD', organization: 'FESD (Friends of Environment and Social Development)', landscape: 'Greater Rift Valley', sites: ['Cyinengwe Site', 'Gatare Site', 'Kabugabo Site'] },
  { name: 'Goshen Farm Exporters', organization: 'Goshen Farm Exporters Ltd', landscape: 'Greater Rift Valley', sites: ['Kaiti', 'Kilome', 'Mbooni'] },
  { name: 'GOSHEN GLOBAL VISION', organization: 'GOSHEN GLOBAL VISION (GGV)', landscape: 'Greater Rift Valley', sites: ['Subri River Reforestation Site', 'Wassa East Cocoa Agroforestry Site'] },
  { name: 'Green Belt Movement', organization: 'Green Belt Movement (GBM)', landscape: 'Greater Rift Valley', sites: ['Sururu Forest Upper Mau Beat Site', 'Gatimu Location Agroforestry Site', 'Likia Location Agroforestry Site', 'Mau Narok Location Agroforestry Site'] },
  { name: 'GROOTS Kenya', organization: 'GROOTS Kenya Association', landscape: 'Greater Rift Valley', sites: ['Igwamiti Restoration site', 'Marmanet Restoration site'] },
  { name: 'Grow Tech Nurseries', organization: 'Grow Tech Nurseries LTD', landscape: 'Greater Rift Valley', sites: ['Mau Sustainability Zone'] },
  { name: 'ILEG', organization: 'Institute for Law and Environmental Governance (ILEG)', landscape: 'Greater Rift Valley', sites: ['Isinya site', 'Kitengela Site', 'Korompoi site', 'Mailui site', 'Namanga Site'] },
  { name: 'ITF', organization: 'International Tree Foundation (ITF)', landscape: 'Greater Rift Valley', sites: ['Marsabit Agroforestry', 'Kapkanyar Forest West Pokot', 'Ndaragwa Forest Nyandarua County', 'Nyandarua agroforestry', 'Siyoi Ward West Pokot Agroforestry'] },
  { name: 'Jumuisha Initiative', organization: 'Jumuisha Initiative Community Based Organization', landscape: 'Greater Rift Valley', sites: ['Kibwezi East Masaku Ndogo Cluster', 'Kibwezi Kyumani cluster', 'Kibwezi Muliluni Forest Cluster', 'Kibwezi Ulilinzi cluster', 'Kibwezi Utini cluster'] },
  { name: 'Justdiggit', organization: 'Justdiggit', landscape: 'Greater Rift Valley', sites: ['Lower Loita', 'Magadi', 'Upper Loita'] },
  { name: 'KENVO', organization: 'Kijabe Environment Volunteers (KENVO)', landscape: 'Greater Rift Valley', sites: ['GITITHIA-KIJABE AGROFORESTRY SITE', 'Mai-mahiu Reforestation site'] },
  { name: 'Kimplanter', organization: 'Kimplanter Seedlings and Nurseries Ltd', landscape: 'Greater Rift Valley', sites: ['Site 1 Lenkism', 'Site 2 Kimana Imbirikani'] },
  { name: 'Kula', organization: 'Kula', landscape: 'Greater Rift Valley', sites: ['Nyabitekeri Site'] },
  { name: 'Laikipia Wildlife Forum', organization: 'Laikipia Wildlife Forum Limited (LWF)', landscape: 'Greater Rift Valley', sites: ['Likii WRUA Riparian Area Nanyuki', 'Musul Community Land ANR Doldol', 'Nanyuki WRUA Riparian Area', 'Shamanek CFA Natural Forest Nyahururu'] },
  { name: 'LOCCOG', organization: 'Lake Ol Bolossat Community Conservation Group (LOCCOG)', landscape: 'Greater Rift Valley', sites: ['Shamata Kirima-Muruai Restoration Site'] },
  { name: 'Leona Foundation', organization: 'Leona Foundation', landscape: 'Greater Rift Valley', sites: ['Subukia Site'] },
  { name: 'Moto Feeds', organization: 'Moto Feeds', landscape: 'Greater Rift Valley', sites: ['Eburru Farmlands', 'Eburru Forest', 'Mau Forest'] },
  { name: 'Nabahya Food Institute', organization: 'Nabahya Food Institute (NFI)', landscape: 'Greater Rift Valley', sites: ['Kabunambo Site', 'Katogota Site', 'Kigoma Site', 'Lubarika Site'] },
  { name: 'Nature Kenya', organization: 'Nature Kenya (The East Africa Natural History Society)', landscape: 'Greater Rift Valley', sites: ['Cheptongei Forest Elgeyo Marakwet', 'Cherangany Forest Elgeyo Marakwet', 'Chesoi Embobut Forest Elgeyo Marakwet', 'Elgeyo Forest Elgeyo Marakwet', 'Kapyego Embobut Forest Elgeyo Marakwet', 'Kessup Forest Elgeyo Marakwet'] },
  { name: 'OPDP', organization: 'Ogiek Peoples Development Program (OPDP)', landscape: 'Greater Rift Valley', sites: ['Musegekwa Nessuit site'] },
  { name: 'Orchard Juice', organization: 'ORCHARD JUICE LIMITED', landscape: 'Greater Rift Valley', sites: ['KIBWEZI EAST SUB-COUNTY', 'KIBWEZI WEST SUB-COUNTY', 'MAKUENI SUB-COUNTY'] },
  { name: 'PACJA', organization: 'PAN AFRICAN CLIMATE JUSTICE ALLIANCE (PACJA)', landscape: 'Greater Rift Valley', sites: ['Kapkoris Forest', 'Karas forest', 'Parua Forest'] },
  { name: 'Paran Women Group', organization: 'Paran women group', landscape: 'Greater Rift Valley', sites: ['Serre leone Mau Forest'] },
  { name: 'RESCONI', organization: 'Resource Conservation Initiative (RESCONI)', landscape: 'Greater Rift Valley', sites: ['ASUTIFI NORTH SITE', 'ATWIMA MPONUA SITE'] },
  { name: 'SAVE KENYA WATER TOWERS', organization: 'SAVE KENYA WATER TOWERS', landscape: 'Greater Rift Valley', sites: ['MOROP SUB-LOCATION'] },
  { name: 'SCOPE INTERVENTION', organization: 'Saving and Conservation of Our Planet Earth Intervention', landscape: 'Greater Rift Valley', sites: ['Torok River'] },
  { name: 'SEED SAVERS', organization: 'SEED SAVERS NETWORK ASSOCIATION', landscape: 'Greater Rift Valley', sites: ['Mauche and Mau Narok site'] },
  { name: 'Slow Food Kenya', organization: 'Slow Food Convivia Association of Kenya', landscape: 'Greater Rift Valley', sites: ['Kitiro sub-location'] },
  { name: 'SAFI', organization: 'Sustainable Agroforestry Initiative (SAFI)', landscape: 'Greater Rift Valley', sites: ['Nsuta Bono Cocoa landscape'] },
  { name: 'Talmond', organization: 'Talmond Ltd.', landscape: 'Greater Rift Valley', sites: ['Ahafo Regional Tropical Almond Agroforestry', 'Eastern Regional Tropical Almond Agroforestry', 'Suhum Municipality Agroforestry', 'Volta Regional Tropical Almond Agroforestry'] },
  { name: 'NGARA', organization: 'The Network for Natural Gums and Resins in Africa - NGARA', landscape: 'Greater Rift Valley', sites: ['KEFRI Marigat site', 'KEFRI Tenges site'] },
  { name: 'Wezesha CBO', organization: 'Wezesha community Based organization', landscape: 'Greater Rift Valley', sites: ['Bahati Site'] },
  { name: 'WCI', organization: 'Wildlife Conservation Initiative (WCI)', landscape: 'Greater Rift Valley', sites: ['Giciye river site', 'Mukungwa river site', 'Nyamutera river site'] },
  { name: 'WWF-Kenya', organization: 'World Wide Fund for Nature Kenya (WWF-Kenya)', landscape: 'Greater Rift Valley', sites: ['Kinangop', 'Kipipiri', 'Olkalou'] },
  { name: 'Y&M Regeneration', organization: 'Y&M REGENERATION LIMITED', landscape: 'Greater Rift Valley', sites: ['Agroforest carbon project Site 1', 'Agroforest carbon project site 2 Juaso Forest Reserve'] },
  { name: 'TIST Kenya', organization: 'TIST Kenya', landscape: 'Greater Rift Valley', sites: ['Meru Cluster', 'Mt Kenya East', 'Nanyuki Cluster'] },
  { name: 'Vi Agroforestry', organization: 'Vi Agroforestry', landscape: 'Greater Rift Valley', sites: ['Kisumu Site', 'Siaya Site'] },
  { name: 'COPICAD', organization: 'COPICAD Community Based Organization', landscape: 'Greater Rift Valley', sites: ['Olbolossat Forest Planting site'] },

  // ═══ Lake Kivu & Rusizi (35 projects) ═══
  { name: 'APEFA', organization: 'Action pour la Protection de l\'Environnement et la Promotion des Filieres Agricoles', landscape: 'Lake Kivu & Rusizi', sites: ['KIBATAMA SITE - AF', 'KAMUREHE SITE -AF', 'MURURU-NYAKARENZO- River', 'Nyungu Site'] },
  { name: 'AEE Rwanda', organization: 'African Evangelistic Enterprise-AEE Rwanda', landscape: 'Lake Kivu & Rusizi', sites: ['Gikundamvura Site', 'Gitambi Site', 'Nyabintare Site', 'Rwimbogo Site'] },
  { name: 'ARCOS Network', organization: 'Albertine Rift Conservation Society (ARCOS Network)', landscape: 'Lake Kivu & Rusizi', sites: ['FCPEEP BUGORHE PROJECT SITE', 'FCPEEP IRAMBI-KATANA PROJECT SITE'] },
  { name: 'APROCUVI', organization: 'Association Pour la promotion des Cultures Vivrieres (APROCUVI)', landscape: 'Lake Kivu & Rusizi', sites: ['GISUMO', 'KIRINZI', 'RUGENDO', 'RURAMATA'] },
  { name: 'ADIC', organization: 'Association pour le Developpement Integral des Communautes (ADIC)', landscape: 'Lake Kivu & Rusizi', sites: ['BUTANUKA'] },
  { name: 'ARDE/KUBAHO', organization: 'ASSOCIATION RWANDAISE POUR LE DEVELOPPEMENT ENDOGENE', landscape: 'Lake Kivu & Rusizi', sites: ['Cyanzarwe Site', 'Gikombe Site', 'Nyarushamba site'] },
  { name: 'BIOCOOR', organization: 'BIODIVERSITY CONSERVATION ORGANIZATION (BIOCOOR)', landscape: 'Lake Kivu & Rusizi', sites: ['DOGA SITE', 'RUBOREZA SITE'] },
  { name: 'CCAO', organization: 'CLIMATE CHANGE AFRICA OPPORTUNITIES (CCAO)', landscape: 'Lake Kivu & Rusizi', sites: ['Kamayola', 'Katogota', 'Luvungi'] },
  { name: 'Communities of Hope', organization: 'Communities of Hope (COH)', landscape: 'Lake Kivu & Rusizi', sites: ['Bukinanyana', 'Mabayi', 'Mpanda', 'Musigati', 'PNK'] },
  { name: 'COSEO', organization: 'Community Socio-Environmental Organization (COSEO)', landscape: 'Lake Kivu & Rusizi', sites: ['Benonin', 'Mumberes', 'Sawich/Chemususu', 'ARAMA/CHEMESWON'] },
  { name: 'Consortium APRN/3C', organization: 'Consortium APRN/BEPB et Association 3C', landscape: 'Lake Kivu & Rusizi', sites: ['Agroforesterie', 'Foresterie', 'Regeneration Naturelle Assistee'] },
  { name: 'CDCT', organization: 'COOPERATIVE DES CAFEICULTEURS TUUNGANE (CDCT)', landscape: 'Lake Kivu & Rusizi', sites: ['Buheba', 'Butole', 'Langala', 'Lubarika'] },
  { name: 'Forest of Hope', organization: 'Forest of Hope Association (FHA)', landscape: 'Lake Kivu & Rusizi', sites: ['Kigeyo site', 'upper Gishwati Site'] },
  { name: 'Green Action Developpement', organization: 'Green Action Developpement (GAD)', landscape: 'Lake Kivu & Rusizi', sites: ['Burhale Agroforestry', 'Burhale RNA'] },
  { name: 'Greening Burundi', organization: 'Greening Burundi', landscape: 'Lake Kivu & Rusizi', sites: ['Gihungwe', 'Kagwema', 'Rubanga', 'Rucamihigo', 'Rugunga', 'Rusakaronge'] },
  { name: 'IADL', organization: 'Initiatives et Actions pour le developpement Local', landscape: 'Lake Kivu & Rusizi', sites: ['KABARE CENTRE-KINJUBA', 'KABARE SUD-KALAGANE'] },
  { name: 'INES Ruhengeri', organization: 'INSTITUT D\'ENSEIGNEMENT SUPERIEUR DE RUHENGERI', landscape: 'Lake Kivu & Rusizi', sites: ['HEPFU SITE', 'KABUGA SITE', 'MIRAMBA SITE', 'MURAMBA SITE', 'NYABINTARE SITE', 'RUGABANO SITE'] },
  { name: 'IGH', organization: 'Itombwe Generation pour l\'Humanite - IGH', landscape: 'Lake Kivu & Rusizi', sites: ['Lusenda site', 'Makobola Site', 'Mboko Site'] },
  { name: 'J&R Engineering', organization: 'J&R Engineering and General Business LTD with GreenGoal Rwanda CBC', landscape: 'Lake Kivu & Rusizi', sites: ['Kamembe Restoration site', 'Nkungu restoration site', 'Nyamasheke Restoration Site'] },
  { name: 'MIHOSO', organization: 'MIHOSO INTERNATIONAL FOUNDATION LBG', landscape: 'Lake Kivu & Rusizi', sites: ['Gambia No. 2 Asunafo North District'] },
  { name: 'ODEB', organization: 'Organisation de Defense de l\'Environnement et le Developpement Durable', landscape: 'Lake Kivu & Rusizi', sites: ['Kagwema', 'Rugunga/Ndava'] },
  { name: 'OSEPCCA', organization: 'ORGANIZATION FOR SUPPORT ENVIRONMENT PROTECTION AND CLIMATE CHANGE ADAPTATION', landscape: 'Lake Kivu & Rusizi', sites: ['Boneza Site'] },
  { name: 'PVC Burundi', organization: 'Perfect Village Communities PVC Burundi', landscape: 'Lake Kivu & Rusizi', sites: ['NYABIRABA'] },
  { name: 'PLATE FORME DIOBASS', organization: 'PLATE FORME DIOBASS AU KIVU', landscape: 'Lake Kivu & Rusizi', sites: ['IBAMBIRO', 'ISHAMBA-RUSHEBEYI', 'KAFUNDA-MISUNYU', 'MUSIMBI-NGOMO', 'NYAMURHAMBYE-KAMINA', 'NYARUBALE-BUGWAGA'] },
  { name: 'Prime Biodiversity', organization: 'Prime Biodiversity Conservation (PBC)', landscape: 'Lake Kivu & Rusizi', sites: ['ANR', 'Kanama Site', 'Mukura Site', 'Mushubati Site', 'Nyabirasi', 'Rugerero Site'] },
  { name: 'RECEVOR', organization: 'RECEVOR', landscape: 'Lake Kivu & Rusizi', sites: ['Bugarama Site', 'Nyakabuye Site'] },
  { name: 'RESEAU BURUNDI 2000', organization: 'RESEAU BURUNDI 2000 Plus', landscape: 'Lake Kivu & Rusizi', sites: ['KAGWEMA Restauration', 'RUGUNGA Restauration'] },
  { name: 'RDI', organization: 'Rural Development Initiative (RDI)', landscape: 'Lake Kivu & Rusizi', sites: ['KAGEYO', 'RUBENGERA', 'GISANZE'] },
  { name: 'REDO', organization: 'Rural Environment and Development Organization (REDO)', landscape: 'Lake Kivu & Rusizi', sites: ['GASHONGA-BUHOKORO', 'GASHONGA-KABAKOBWA', 'GASHONGA-KABAKOBWA wetland', 'GASHONGA-RUSAYO'] },
  { name: 'RCCDN', organization: 'Rwanda Climate Change and Development Network (RCCDN)', landscape: 'Lake Kivu & Rusizi', sites: ['Murangara Site', 'Nyagatovu Site', 'Ryaruhanga Site'] },
  { name: 'RECOR', organization: 'RWANDA ENVIRONMENTAL CONSERVATION ORGANIZATION, RECOR', landscape: 'Lake Kivu & Rusizi', sites: ['NYABITEKERI Buffer Zone Site', 'SHANGI Agroforestry Site', 'SHANGI Buffer Zone Site', 'NYABITEKERI Agroforestry Site'] },
  { name: 'ROAM', organization: 'Rwanda Organic Agriculture Movement (ROAM)', landscape: 'Lake Kivu & Rusizi', sites: ['Gihango Site', 'MUSHUBATI SITE'] },
  { name: 'RWARRI', organization: 'Rwanda Rural Rehabilitation Initiative (RWARRI)', landscape: 'Lake Kivu & Rusizi', sites: ['Burehe Site', 'Gitsimbi Site', 'Mushonyi Site', 'Nkora Site', 'Nyamwenda Site', 'Rubavu Site'] },
  { name: 'RDIS', organization: 'The Rural Development Interdiocesan Service (RDIS)', landscape: 'Lake Kivu & Rusizi', sites: ['Bweyeye Site', 'Gihombo Site', 'Kamembe Site', 'Kanjongo Site', 'Kirimbi Site', 'Nzahaha Site'] },
  { name: 'UESEF', organization: 'UNIS POUR L\'EDUCATION SOCIOENVIRONNEMENTALE DE LA FEMME', landscape: 'Lake Kivu & Rusizi', sites: ['KATOLO KALUNGU planting site', 'NGWIRO KITEMBO planting site'] },
  { name: 'UNIPROBA', organization: 'Unissons-nous pour la Promotion des Batwa UNIPROBA', landscape: 'Lake Kivu & Rusizi', sites: ['KABURANTWA-KABURANTWA', 'KABURANTWA-NYANKUNGU', 'NYAMITANGA-NYAMITANGA', 'NYAMITANGA-ZINA'] },
  { name: 'WDI', organization: 'Woman Development Initiative (WDI)', landscape: 'Lake Kivu & Rusizi', sites: ['KAGONYI', 'KARENGANE', 'NYABWUYA', 'RWAMIKO'] },
  { name: 'WWANC', organization: 'Women In Water and Natural Resources Conservation (WWANC)', landscape: 'Lake Kivu & Rusizi', sites: ['MAU COMPLEX CHEBITET'] },
  { name: 'Well For Zoe', organization: 'Well For Zoe', landscape: 'Lake Kivu & Rusizi', sites: ['Bugesera', 'Gisagara', 'Nyamagabe'] },
];

export async function seedDatabase(): Promise<void> {
  const alreadySeeded = await isDatabaseSeeded();
  if (alreadySeeded) return;

  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    for (const project of SEED_DATA) {
      const result = await database.runAsync(
        'INSERT INTO projects (name, organization, landscape) VALUES (?, ?, ?)',
        [project.name, project.organization, project.landscape]
      );
      const projectId = result.lastInsertRowId;

      for (const siteName of project.sites) {
        await database.runAsync(
          'INSERT INTO sites (project_id, name) VALUES (?, ?)',
          [projectId, siteName]
        );
      }
    }
  });
}

export function getOrganizations(): string[] {
  return SEED_DATA.map(p => p.name).sort();
}
