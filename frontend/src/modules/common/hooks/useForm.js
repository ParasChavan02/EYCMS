import { useState } from 'react'

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => setValues(initialValues)

  return { values, handleChange, resetForm }
}
