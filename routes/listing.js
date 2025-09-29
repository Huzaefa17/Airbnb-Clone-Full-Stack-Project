const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { listingSchema } = require('../schema.js');
const Listing = require('../models/listing');
const { isLoggedIn } = require('../middleware');


const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const Errmsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, Errmsg);
    }
    next();
};

router.get('/', wrapAsync(async (req, res) => {
    const allListings= await Listing.find({});
    res.render('listings/index.ejs', { listings: allListings });
}));

// New Route
router.get('/new', isLoggedIn, (req, res) => {
    res.render('listings/new.ejs');
});

// Show Route
router.get('/:id', wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate('reviews');
    if (!listing){
        req.flash('error', 'Cannot find the listing!');
        return res.redirect('/listings');
    }
    res.render('listings/show.ejs', { listing });
}));

// Create Route
router.post("/",
    isLoggedIn,
    validateListing,
    wrapAsync(async (req,res,next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    req.flash('success', 'Successfully created a new listing!');
    res.redirect('/listings');
}));

// Edit Route
router.get("/:id/edit", isLoggedIn, wrapAsync(async (req,res) =>{
    let {id} =req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash('error', 'Cannot find the listing!');
        return res.redirect('/listings');
    }
    res.render("listings/edit.ejs", {listing});
}));

// Update Route
router.put("/:id",
    isLoggedIn,
    validateListing,
    wrapAsync(async (req,res) => {
    let {id}= req.params;
    await Listing.findByIdAndUpdate(id, req.body.listing, {runValidators: true, new: true});
    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${id}`);
}));

// Delete Route
router.delete("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the listing!');
    res.redirect("/listings");
}));

module.exports = router;