//import './assets/style.css'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-icons/font/bootstrap-icons.css'
import 'luxon'
import './assets/app.postcss'
import App from './App.svelte'
// import 'bootstrap/dist/js/bootstrap.bundle'

const app = new App({
  target: document.getElementById('app') || new HTMLElement()
})

export default app
