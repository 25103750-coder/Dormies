// ============================================================================================
// FILE: frontend/src/components/PageHead.jsx
// PART OF: Front end > Components
// WHAT IT DOES: Page title and subtitle, with room for the buttons on the right.
// ============================================================================================
import React from 'react'

export default function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head no-print">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {children && <div className="actions">{children}</div>}
    </div>
  )
}
