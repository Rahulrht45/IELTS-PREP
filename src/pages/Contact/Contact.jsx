import React from 'react';
import './Contact.css';

const Contact = () => {
    return (
        <div className="contact-page page-container">
            <h1>Contact Us</h1>
            <form className="contact-form">
                <input type="text" placeholder="Full Name" />
                <input type="email" placeholder="Email Address" />
                <textarea placeholder="Your Message" rows="6"></textarea>
                <button type="submit" className="btn-primary-red">Send Message</button>
            </form>
        </div>
    );
};

export default Contact;
