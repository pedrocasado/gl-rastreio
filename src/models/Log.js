module.exports = (sequelize, DataTypes) => {
    const Log = sequelize.define(
        'Log',
        {
            acn: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            ref: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            ip: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            json_response: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            dt_created: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false,
            // disable the modification of tablenames; By default, sequelize will automatically
            // transform all passed model names (first parameter of define) into plural.
            // if you don't want that, set the following
            freezeTableName: true,
            tableName: 'log',
        },
    );

    return Log;
};
