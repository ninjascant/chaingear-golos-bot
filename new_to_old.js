const toml = require('toml')

const convertToOld = (new_file) => {
  let old_json = {
    genesis_id: '',
    system: new_file.description.project_name,
    dependencies: [],
    icon: new_file.description.logo,
    token: {
      name: new_file.ico.common_info.token[0].name,
      symbol: new_file.ico.common_info.token[0].symbol
    },
    consensus: {
      consensus_type: new_file.ico.common_info.token[0].consensus_name.match(/\b(\w)/g).join('').toUpperCase(),
      consensus_name: new_file.ico.common_info.token[0].consensus_name
    },
    descriptions: {
      state: 'Project',
      system_type: 'cryptoasset',
      headline: new_file.description.headline
    },
    crowdsales: {
      start_date: new_file.ico.phases[0].dates.start_date,
      end_date: new_file.ico.phases[0].dates.end_date,
      end_date_plan: new_file.ico.phases[0].dates.end_date,
      genesis_address: [''],
      funding_term: new_file.ico.phases[0].terms.sales_agreement,
      funding_url: new_file.ico.phases[0].terms.sales_url,
      tokens_sold: new_file.ico.phases[0].terms.sold_tokens,
      tokens_issued: new_file.ico.phases[0].terms.issued_tokens,
      btc_raised: '',
      cap_limit: [], //new_file.ico.phases.terms.cap_limit
      raised: ['']
    },
    links: new_file.links
  }
  old_json.dependencies.push(new_file.ico.common_info.token[0].dependency)
  old_json.crowdsales.cap_limit.push(new_file.ico.phases[0].terms.cap_limit)
  return old_json
}
module.exports = convertToOld  
