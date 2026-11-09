import { GLASS, WHEELS } from './shared'

export const camper = (c: string) =>
  WHEELS +
  '<rect x="-21" y="-9.2" width="42" height="18.4" rx="3.5" fill="#efe6d2" stroke="#b9ad94" stroke-width=".6"/>' +
  `<path d="M11-9.2H17.5Q21-9.2 21-5.7V5.7Q21 9.2 17.5 9.2H11Z" fill="${c}"/>` +
  `<path d="M13.5-7.4Q18.8-7 19.4 0Q18.8 7 13.5 7.4Z" fill="${GLASS}"/><rect x="-21" y="-1.3" width="32" height="2.6" fill="${c}"/>` +
  '<rect x="-15" y="-6" width="7" height="4" rx="1" fill="none" stroke="#b9ad94" stroke-width=".7"/><rect x="-4" y="-6" width="7" height="4" rx="1" fill="none" stroke="#b9ad94" stroke-width=".7"/>'

export const camperShape = '<rect x="-21" y="-9.2" width="42" height="18.4" rx="3.5"/>'
