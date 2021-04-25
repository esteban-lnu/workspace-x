import { writable } from 'svelte/store'

const workspacex = writable([])

const customWorkspacexStore = {
  subscribe: workspacex.subscribe,
  setWorskpacex: (workspacexArray) => {
    workspacex.set(workspacexArray)
  },
  addWorkspacex: (workspacexData ) => {
    const newWorkspacex = workspacexData
    workspacex.update( items => {
      return [newWorkspacex, ...items]
    })
  },
  updateWorkspacex: (id, workspacexData) => {
    workspacex.update(items => {
      const workspacexIndex = items.findIndex(item => item.id === id)
      const updatedWorkspace = { ...items[workspacexIndex], ...workspacexData }
      const updatedWorkspacex = [...items]
      updatedWorkspacex[workspacexIndex] = updatedWorkspace

      return updatedWorkspacex
    })
  },
  removeWorkspacex: (id) => {
    workspacex.update(items => {
      return items.filter(item => item.id !== id)
    })
  },
  toggleFavorite: (id) => {
    workspacex.update(items => {
      const updatedWorkspacex = { ...items.find(m => m.id === id) }
      updatedWorkspacex.isFavorite = !updatedWorkspacex.isFavorite

      const workspacexIndex = items.findIndex(m => m.id === id)

      const updatedWorkspacexs = [...items]
      updatedWorkspacexs[workspacexIndex] = updatedWorkspacex

      return updatedWorkspacexs
    })
  }
}

export default customWorkspacexStore