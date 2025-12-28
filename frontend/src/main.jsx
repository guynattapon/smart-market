import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ลบ StrictMode ออกแล้ว เพื่อแก้บั๊ก Recharts
createRoot(document.getElementById('root')).render(
    <App />
)