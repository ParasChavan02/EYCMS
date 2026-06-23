function TransactionLineRow({ formData, handleChange }) {

return(

<div className="line-section">

<h3>Double Entry Accounting</h3>

<div className="line-row">

<div className="field">

<label>Debit Account</label>

<select
name="debit"
value={formData.debit}
onChange={handleChange}
>

<option value="">Select Debit Account</option>

<option>Bank Account</option>

<option>Cash Account</option>

<option>Expense Account</option>

<option>Entrepreneur Grant Account</option>

<option>Training Expense Account</option>

<option>Travel Expense Account</option>

</select>

</div>

<div className="field">

<label>Credit Account</label>

<select
name="credit"
value={formData.credit}
onChange={handleChange}
>

<option value="">Select Credit Account</option>

<option>Government Grant</option>

<option>Bank Account</option>

<option>Vendor Account</option>

<option>Cash Account</option>

<option>Program Fund</option>

<option>Outstanding Bills</option>

</select>

</div>

</div>

<div className="account-note">

<p>

Every transaction must contain
<strong> one Debit Account </strong>
and
<strong> one Credit Account</strong>.

</p>

</div>

</div>

);

}

export default TransactionLineRow;