import { NextResponse } from 'next/server'

import { HeaderItem } from '@/app/types/menu'
import { aboutdata } from '@/app/types/aboutdata'
import { featureddata } from '@/app/types/featureddata'
import { footerlinks } from '@/app/types/footerlinks'

// header nav-links data
const headerData: HeaderItem[] = [
  { label: 'Accueil', href: '#home' },
  { label: 'À propos', href: '#About' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Philosophie', href: '#beliefs' },
]

// about data
const Aboutdata: aboutdata[] = [
  {
    heading: 'À propos du nous.',
    imgSrc: '/images/aboutus/imgOne.svg',
    paragraph:
      'SecFlowCheck est un projet académique développé pour automatiser l\'analyse de sécurité des pipelines CI/CD. Il combine analyse statique de code, détection de vulnérabilités et monitoring en temps réel pour aider les équipes DevOps à sécuriser leurs workflows de développement',
    link: 'Voir plus',
  },
  {
    heading: 'Fonctionnalités.',
    imgSrc: '/images/aboutus/imgTwo.svg',
    paragraph:
      'Analyse automatique des pipelines GitHub Actions et GitLab CI avec détection intelligente des vulnérabilités, scoring de sécurité basé sur l\'IA, et génération de rapports HTML détaillés avec recommandations actionnables pour améliorer la sécurité de vos workflows',
    link: 'Voir plus',
  },
  {
    heading: 'Architecture.',
    imgSrc: '/images/aboutus/imgThree.svg',
    paragraph:
      'Architecture microservices moderne avec 3 services Python (Parser, Analyzer, Report), communication hybride REST/RabbitMQ, frontend Next.js, et stack complète incluant FastAPI, Docker, PostgreSQL et Spring Cloud Gateway pour une scalabilité optimale',
    link: 'Voir plus',
  },
]

// featured data
const FeaturedData: featureddata[] = [
  {
    heading: 'Détection de Secrets en Clair.',
    imgSrc: '/images/featured/key_secret.jpg',
  },
  {
    heading: 'Analyse des Permissions CI/CD.',
    imgSrc: '/images/featured/permissions.jpg',
  },
  {
    heading: 'Validation des Étapes de Sécurité.',
    imgSrc: '/images/featured/validation.jpg',
  },
  {
    heading: 'Rapports de Conformité Détaillés.',
    imgSrc: '/images/featured/report.jpg',
  },
]

// footer links data
const FooterLinksData: footerlinks[] = [
  {
    section: 'Navigation',
    links: [
      { label: 'Accueil', href: '#home' },
      { label: 'À propos', href: '#About' },
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Philosophie', href: '#beliefs' },
    ],
  },
  {
    section: 'Liens Utiles',
    links: [
      { label: 'GitHub', href: 'https://github.com/DeveYou/SecFlowCheck' },
    ],
  },
]

export const GET = () => {
  return NextResponse.json({
    headerData,
    Aboutdata,
    FeaturedData,
    FooterLinksData,
  })
}
