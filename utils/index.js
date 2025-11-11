export const createPageUrl = (page) => {
  const pageMap = {
    'Dashboard': '/dashboard',
    'Contests': '/contests',
    'Feed': '/feed',
    'Search': '/search',
    'Profile': '/profile',
    'Winners': '/winners',
    'About': '/about'
  }
  return pageMap[page] || '/'
}

export { Link } from 'react-router-dom'
