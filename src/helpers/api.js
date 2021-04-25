// Api.js
import axios from 'axios'

// Create a instance of axios to use the same base url.
const axiosAPI = axios.create({
  baseURL: 'https://pokeapi.co/api/v2/' // it's not recommended to have this info here.
})

// implement a method to execute all the request from here.
/**
 * A..
 *
 * @param {*} method - bla.
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const apiRequest = (method, url, request) => {
  const headers = {
    authorization: ''
  }
  // using the axios instance to perform the request that received from each http method
  return axiosAPI({
    method,
    url,
    data: request,
    headers
  }).then(res => {
    return Promise.resolve(res.data)
  })
    .catch(err => {
      return Promise.reject(err)
    })
}

/**
 * Function to execute the http get request.
 *
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const get = (url, request) => apiRequest('get', url, request)

/**
 * Function to execute the http DELETE request.
 *
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const deleteRequest = (url, request) => apiRequest('delete', url, request)

/**
 * Ffunction to execute the http POST request.
 *
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const post = (url, request) => apiRequest('post', url, request)

/**
 * Ffunction to execute the http PUT request.
 *
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const put = (url, request) => apiRequest('put', url, request)

/**
 * Ffunction to execute the http PATCH request.
 *
 * @param {*} url - blu.
 * @param {*} request - ble.
 * @returns {object} - whatever.
 */
const patch = (url, request) => apiRequest('patch', url, request)

// expose your method to other services or actions
const API = {
  get,
  delete: deleteRequest,
  post,
  put,
  patch
}
export default API
