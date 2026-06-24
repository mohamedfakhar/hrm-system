import { useState } from 'react';
import api from '../../api/axios';
import './AddHR.css';


export default function AddHR() {


  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });


  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };




  // Submit Form
  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);



    try {

      await api.post('/auth/add-hr', formData);


      setSuccess(
        'HR Manager account created successfully!'
      );


      setFormData({
        email: '',
        password: ''
      });


    } catch(err) {


      setError(
        err.response?.data?.message ||
        'Something went wrong'
      );


    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="add-hr-page">


      <h2 className="add-hr-title">
        Add New HR Manager
      </h2>



      {
        error && (
          <div className="error-box">
            {error}
          </div>
        )
      }



      {
        success && (
          <div className="success-box">
            {success}
          </div>
        )
      }




      <form 
        onSubmit={handleSubmit}
        className="add-hr-form"
      >



        <div className="form-field">

          <label>
            Email
          </label>


          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="hr@company.com"
            required
          />


        </div>





        <div className="form-field">


          <label>
            Password
          </label>


          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />


        </div>





        <button
          type="submit"
          disabled={loading}
          className="create-btn"
        >

          {
            loading
            ? 'Creating...'
            : 'Create HR Account'
          }


        </button>



      </form>


    </div>

  );

}