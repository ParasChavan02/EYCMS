function BankForm() {
  return (
    <form className="bank-form">
      <label>
        Bank name
        <input type="text" placeholder="Bank name" />
      </label>
      <label>
        Account number
        <input type="text" placeholder="Account number" />
      </label>
    </form>
  )
}

export default BankForm
