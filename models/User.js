const { getDB } = require("../config/sequelize");
const sequelize = getDB();
const { Model, DataTypes } = require("sequelize");

class User extends Model {}
User.init(
    {
        username: {
            type: DataTypes.STRING(100),
            primaryKey: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        alamat: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        norek: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        role:{
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        isVerified:{
            type: DataTypes.INTEGER(4),
            allowNull: false,
        }
    },  
    {
        sequelize,
        timestamps: false, 
        modelName: "User",
        tableName: "users",
    }
);
    
User.sync({ alter: true })  

module.exports = User;