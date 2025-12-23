import { User } from "../models/user.js";
import httpStatus from "http-status";
import bcrypt, {hash} from "bcrypt";
import { Meeting } from "../models/meeting.js";
import crypto from "node:crypto"; 

const login = async (req, res) => { 
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide username and password." });
    }

    try {
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token: token });
        } else {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
    } catch (error) {
        return res.status(500).json({ message: `Something went wrong ${error}` });
    }
}


const register = async(req, res) => {
    const {name, username, password} = req.body;

    try {
        const existingUser = await User.findOne({username});
        
        if(existingUser){
            res.status(httpStatus.FOUND).json({message: "User already exists."});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        }) 

        await newUser.save();

        res.status(httpStatus.CREATED).json({message: "User Registered Successfully."});

    } catch (e) {
        res.json({message: `Something went wrong ${e}`});
    }
}

const getUserHistory = async (req, res) => {
    const {token} = req.query;
    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.history);


    } catch (error) {
        res.json({message: "Something went wrong. Please try again."});
    }
}


const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        user.history.push({
            meetingCode: meeting_code,
            date: new Date()
        });
        
        await user.save();
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
            date: new Date()
        });
        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history." });

    } catch (e) {
        res.status(500).json({ message: `Something went wrong: ${e}` });
    }
}
export {login, register, getUserHistory, addToHistory};