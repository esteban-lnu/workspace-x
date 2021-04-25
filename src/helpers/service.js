import axios from 'axios'

/**
 * Gets on Service.
 *
 * @param { string } url - The URL to GET content from.
 * @returns { object } The Axios response.
 */
export const getFromService = async (url) => {
  const headers = {
    'Content-Type': 'application/json'
  }

  const result = await axios.get(url, { headers })

  return result
}

/**
 * Update on Service.
 *
 * @param {string} url - Service url.
 * @param {string} method - Update method.
 * @param {object} payload - Data to update.
 * @returns {object} The Axios response.
 */
export const updateOnService = async (url, method, payload) => {
  // headers: {
  //   'PRIVATE-TOKEN': `${process.env.IMAGE_SERVICE_SECRET}`
  // },

  const config = {
    method,
    url,
    data: payload
  }

  return await axios(config)
}
export const isValidEmail = (value) => {
  return new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")
    .test(value)
}